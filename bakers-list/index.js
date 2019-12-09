let votes;
let periodList = [];
let periodIndex = 0; // Index in periodList that is a last period of the displayed scope
let filterState = true;
const ballotVote = {
    yay: {symbol: '<img class="feather" src="../assets/pictures/thumbs-up.svg#circle"/>', description: "Yay"},
    nay: {symbol: '<img class="feather" src="../assets/pictures/thumbs-down.svg#circle"/>', description: "Nay"},
    pass: {symbol: '<img class="feather" src="../assets/pictures/minus.svg#circle"/>', description: "Pass"},
    skip: {symbol: '<img class="feather" src="../assets/pictures/alert-triangle.svg#circle"/>', description: "Skipped voting"},
    none: {symbol: " ", description: "Had no votes"}
}
const storagePrefix = 'pl_';
$('document').ready(function () {
    init();
});
async function init() {
    votes = await newVotingPeriod();
    if (votes.type === 2) {
        votes = await newVotingPeriod(votes.votingPeriod - 1);
    }
    let promises = [];
    promises.push(
        new Promise(async (resolve) => {
            await votes.getVotingData(false);
            periodList.push(votes);
            resolve();
        })
    );
    let vp = votes.votingPeriod;
    while (--vp >= 10) {
        const cache = window.localStorage.getItem(storagePrefix + vp);
        if (cache) {
            console.log("Load " + vp + " from cache");
            if (cache !== 'null') {
                periodList.push(JSON.parse(cache));
            }
        } else {
            promises.push(addPeriod(vp));
        }
    }
    await Promise.all(promises);
    periodList.sort((a, b) => b.votingPeriod - a.votingPeriod);
    handleVotes();
    setScope(periodIndex);
    checkDisabled();
}
async function addPeriod(vp) {
    console.log("Load " + vp + " from API");
    const prevVotes = await newVotingPeriod(vp);
    if (prevVotes instanceof BallotVote || prevVotes instanceof ProposalVote) {
        await prevVotes.getVotingData(false);
        periodList.push(prevVotes);
        window.localStorage.setItem(storagePrefix + vp, JSON.stringify(prevVotes));
    } else {
        window.localStorage.setItem(storagePrefix + vp, 'null');
    }
}
function left() {
    async () => {$("#left").addClass("disabled")};
    if (periodList[periodIndex].votingPeriod > 13) {
        let steps = periodList[periodIndex].type;
        if (periodList[periodIndex].type < 2) {
            steps++;
        }
        periodIndex += steps;
        if (periodList[periodIndex].type < 1 && periodIndex + 1 < periodList.length && periodList[periodIndex].votes.length === 0) {
            return left();
        }
        $("#bakers").find("table tbody").html('');
        setScope(periodIndex);
        reSort();
    }
    checkDisabled();
    return false;
}
function right() {
    $("#right").addClass("disabled");
    if (periodIndex > 0) {
        let steps = 0;
        while (periodIndex - ++steps > 0) {
            if (periodList[periodIndex - steps].type == 0 && steps > 1) {
                break;
            }
        }
        if (steps > 1) {
            periodIndex -= steps - 1;
        } else {
            periodIndex -= steps;
        }
        if (periodList[periodIndex].type < 1 && periodIndex > 0 && periodIndex + 1 < periodList.length && periodList[periodIndex].votes.length === 0) {
            return right();
        }
        $("#bakers").find("table tbody").html('');
        setScope(periodIndex);
        reSort();
    }
    checkDisabled();
    return false;
}
function checkDisabled() {
 if (periodIndex <= 0) {
     $("#right").addClass("disabled");
 } else {
    $("#right").removeClass("disabled");
 }
 if (periodList[periodIndex].votingPeriod <= 13) {
    $("#left").addClass("disabled");
 } else {
    $("#left").removeClass("disabled");
 }
}
function reSort() {
    var config = $('table')[0].config,
        resort = true;
    $.tablesorter.updateAll(config, resort);
}
function getScopeText() {
    let size = periodList[periodIndex].type;
    if (periodList[periodIndex].type > 2) {
        size--;
    }
    return 'Period ' + periodList[periodIndex + size].votingPeriod + ' - ' + periodList[periodIndex].votingPeriod;
}
$('.dropdown-menu').on('click', function (event) {
    const id = event.target.getAttribute('id');
    $('#dropdownMenu')[0].innerHTML = event.target.innerHTML;
    $("#bakers").find("table tbody").html('');
    if (id === 'b1') { // known bakers
        filterState = true;
    } else if (id === 'b2') {
        filterState = false;
    } else {
        filterState = null;
    }
    setScope(periodIndex);
    reSort();
})
function isKnownBaker(pkh) {
    return (pkh2alias(pkh) !== pkh);
}
function handleVotes() {
    for (i in periodList) { // populate with all historical bakers
        for (j in periodList[i].bakers) {
            const pkh = periodList[i].bakers[j].pkh;
            const index = votes.bakers.findIndex(a => a.pkh === pkh)
            if (index === -1) { // add
                votes.bakers.push({ pkh: pkh, rolls: 0 });
            }
        }
    }
    for (baker in votes.bakers) {
        let history = [];
        let voteTime = [];
        ballotVotes = 0;
        ballotMaxVotes = 0;
        for (i in periodList) {
            let index = periodList[i].votes.findIndex(a => a.source === votes.bakers[baker].pkh)
            if (periodList.type !== 2) {
                const rollsIndex = periodList[i].bakers.findIndex(a => a.pkh === votes.bakers[baker].pkh);
                currentRolls = 0;
                if (rollsIndex !== -1) {
                    currentRolls = periodList[i].bakers[rollsIndex].rolls;
                }
                if (index !== -1) { // Voted
                    if (!periodList[i].remainingPeriodBlocks) {
                        ballotVotes += currentRolls;
                        ballotMaxVotes += currentRolls;
                    }
                    switch (periodList[i].votes[index].ballot) {
                        case 'yay':
                            history.push(ballotVote.yay); // history.push("&#9745;");
                            voteTime.push(blockLevel2percentage(periodList[i].votes[index].block_level));
                            break;
                        case 'nay':
                            history.push(ballotVote.nay); // history.push("&#9746;");
                            voteTime.push(blockLevel2percentage(periodList[i].votes[index].block_level));
                            break;
                        case 'pass':
                            history.push(ballotVote.pass); // history.push("&#9744;");
                            voteTime.push(blockLevel2percentage(periodList[i].votes[index].block_level));
                            break;
                        default:
                            //console.log(periodList[i].votes[index].proposal);
                            history.push([]);
                            while (index !== -1) {
                                history[history.length - 1].push({ hash: periodList[i].votes[index].proposal, alias: proposalHash2alias(periodList[i].votes[index].proposal) });
                                index = periodList[i].votes.findIndex(a => a.source === votes.bakers[baker].pkh &&
                                    history[history.length - 1].findIndex(b => a.proposal === b.hash) === -1);
                            }
                            if (!periodList[i].remainingPeriodBlocks) {
                                ballotVotes -= currentRolls;
                                ballotMaxVotes -= currentRolls;
                            }
                            break;
                    }
                } else {
                    //console.log(periodList);
                    const index2 = periodList[i].bakers.findIndex(a => a.pkh === votes.bakers[baker].pkh);
                    if (index2 !== -1) { // Skipped voting
                        if (periodList[i].type !== 0) {
                            if (!periodList[i].remainingPeriodBlocks) {
                                ballotMaxVotes += currentRolls;
                            }
                            history.push(ballotVote.skip);
                        } else {
                            history.push(ballotVote.none);
                        }
                    } else { // No voting rights
                        history.push(ballotVote.none);
                    }
                }
            }
        }
        votes.bakers[baker].history = history;
        let percentage = '-';
        if (ballotMaxVotes > 0) {
            percentage = Math.round(100 * ballotVotes / ballotMaxVotes);
        }
        votes.bakers[baker].participation = { percentage: percentage, fraction: ballotVotes.toLocaleString() + ' / ' + ballotMaxVotes.toLocaleString() };
        votes.bakers[baker].averageTime = getMeanValue(voteTime);
    }
}
function setScope(index) {
    const activeProposal = getActiveProposal();
    if (activeProposal) {
        $("#activeProposal").html(activeProposal);
    } else {
        $("#activeProposal").html('');
    }
    $("#periodScope").html(getScopeText());
    let size = periodList[index].type + 1;
    if (size > 2) {
        size = 3;
    }
    if (size < 2) {
        $("#exploration").addClass('grey');
    } else {
        $("#exploration").removeClass('grey');
    }
    if (size < 3) {
        $("#promotion").addClass('grey');
    } else {
        $("#promotion").removeClass('grey');
    }
    for (baker in votes.bakers) {
        if (filterState === null) {
            addElement(baker, index, size);
        } else if (filterState) {
            if (isKnownBaker(votes.bakers[baker].pkh)) {
                addElement(baker, index, size);
            }
        } else {
            if (!isKnownBaker(votes.bakers[baker].pkh)) {
                addElement(baker, index, size);
            }
        }
    }
    $(".tablesorter").tablesorter({
        theme: 'bootstrap',
        widgets: ["zebra"],
        sortList: [[1, 1]],
        sortAppend: [[1, 1]],
        textExtraction: {
            3: function(node, table, cellIndex) {
                return $(node).find("span").attr("data-content");
            },
            4: function(node, table, cellIndex) {
                return $(node).find("span").attr("data-content");
            }
        }
    });
    const options = {
        trigger: 'focus hover'
    };
    $('.popoverDetails').popover(options);
}
function getActiveProposal() {
    if (periodList[periodIndex].type > 0) {
        return proposalHash2alias(periodList[periodIndex].activeProposal);
        /*let offset = periodList[periodIndex].type;
        if (offset > 2)
            offset--;
        if (periodList[periodIndex + offset].result.length > 0) {
            let winning = 0;
            for (i in periodList[periodIndex + offset].result) {
                if (periodList[periodIndex + offset].result[i][1] > periodList[periodIndex + offset].result[winning][1])
                    largest = i;
            }
            return proposalHash2alias(periodList[periodIndex + offset].result[winning][0]);
        }*/
    }
    return '';
}
function addElement(i, index, size) {
    let proposal = '<td>';
    if (typeof votes.bakers[i].history[index + size - 1] !== 'string' && !votes.bakers[i].history[index + size - 1].symbol) {
        for (j in votes.bakers[i].history[index + size - 1]) {
            if (j > 0) {
                proposal += '<BR>';
            }
            proposal += '<span tabindex="-1" role="button" class="popoverDetails" data-toggle="popover" data-content="' +
                votes.bakers[i].history[index + size - 1][j].hash + '">' +
                votes.bakers[i].history[index + size - 1][j].alias + '</span>'
        }
    }
    proposal += '</td>';
    let exploration = '<td></td>';
    let promotion = '<td></td>';
    if (size > 1) {
        exploration = '<td><span tabindex="-1" role="button" class="popoverDetails" data-toggle="popover" data-content="' + votes.bakers[i].history[index + size - 2].description
        + '">' + votes.bakers[i].history[index + size - 2].symbol + '</span></td>';
    } if (size > 2) {
        promotion = '<td><span tabindex="-1" role="button" class="popoverDetails" data-toggle="popover" data-content="' + votes.bakers[i].history[index].description
        + '">' + votes.bakers[i].history[index].symbol + '</span></td>';
    }
    let participation = '<td></td>';
    if (votes.bakers[i].participation.percentage !== '-') {
        let participationColor = '';
        if (votes.bakers[i].participation.percentage >= 75) {
            participationColor = ' yay';
        } else if (votes.bakers[i].participation.percentage < 50) {
            participationColor = ' nay';
        }
        participation = '<td><span tabindex="-1" role="button" class="popoverDetails' + participationColor + '" data-toggle="popover" data-content="'
            + votes.bakers[i].participation.fraction + '">' +
            votes.bakers[i].participation.percentage + '%</span></td>';
    }
    let average = '<td></td>';
    if (votes.bakers[i].averageTime !== '-') {
        average = '<td>' + (100 - votes.bakers[i].averageTime) + '</td>';
    }
    let img = getIcon(votes.bakers[i].pkh);
    // img = img ? '<img src="../' + img + '" height="24" width="24"> ' : '<svg class="feather"><image xlink:href="../assets/pictures/hard-drive.svg#circle"/></svg> ';
    img = img ? '<img src="../' + img + '" height="24" width="24"> ' : '<img src="../assets/pictures/hard-drive.png" height="24" width="24"> ';
    let name = '<td>' + img + '<span tabindex="-1" role="button" class="popoverDetails" data-toggle="popover" data-content="' + votes.bakers[i].pkh + '">' +
        pkh2alias(votes.bakers[i].pkh) + '</span></td>';
    let rolls = '<td>0</td>';
    let bakerIndex = periodList[periodIndex].bakers.findIndex(a => a.pkh === votes.bakers[i].pkh);
    if (bakerIndex !== -1 && periodList[periodIndex].bakers[bakerIndex].rolls !== 0) {
        rolls = '<td>' + periodList[periodIndex].bakers[bakerIndex].rolls.toLocaleString() + '</td>';
        $("#bakers").find("table tbody").append($('<tr>' + name + rolls +
            proposal + exploration + promotion + participation + average + '</tr>').data('number', i).attr('id', 'row' + i));
    }
}
function blockLevel2percentage(blockLevel) {
    const pl = 32768;
    return (blockLevel % pl) / pl;
}
function getMeanValue(percentage) {
    let tot = 0;
    if (percentage.length === 0)
        return "-";
    for (i in percentage) {
        tot += percentage[i];
    }
    return Math.round((100 * tot) / percentage.length);
}