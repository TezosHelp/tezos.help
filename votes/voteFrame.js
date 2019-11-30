let vote;
const target = '#govinfo';
$('document').ready(function(){
	init();
});
async function init () {
    vote = await newVotingPeriod();
    if (vote.title !== 'Testing phase') {
    await Promise.all([vote.getResult(), vote.getRollCount()])
        .then(res => {
            vote.result = res[0];
            vote.totalRolls = res[1].totalRolls;
        });
    }
    print(vote);
}
function print() {
    switch(vote.title) {
        case 'Proposal vote':
            $(target).append(wrap('Proposal period ' + getElapsedTime()));
            printProposalResult();
            break;
        case 'Exploration vote':
            $(target).append(wrap('Exploration period ' + getElapsedTime()));
            printBallotResult();
            break;
        case 'Testing phase':
            $(target).append(wrap('Testing period ' + getElapsedTime()));
            printTesting();
            break;
        case 'Promotion vote':
            $(target).append(wrap('Promotion vote ' + getElapsedTime()));
            printBallotResult();
            break;
    }
}
function wrap(content) { return '<h5 class="newsitem">' + content + '</h5>'}
function getElapsedTime() {
    const rpb = vote.remainingPeriodBlocks;
    return Math.round(((32768 - rpb) / 32768) * 100) + '%';
}
function printProposalResult() {
    if (vote.result.length === 0) {
        $(target).append("<BR>" + wrap("No proposals yet"));
    } else if (vote.result.length < 2) {
        $(target).append("<BR>" + wrap(formatProposal(vote.result[0])));
    } else {
        vote.result.sort((a, b) => {
            return (a[1] < b[1]) ? 1 : (a[1] > b[1]) ? -1 : 0;
        });
        $(target).append(wrap(formatProposal(vote.result[0])));
        $(target).append(wrap(formatProposal(vote.result[1])));
    }
    addVotesLink();
}
function formatProposal(prop) {
    let name = proposalHash2alias(prop[0]);
    if (name === prop[0])
        name = prop[0].slice(0, 9)
    return name + ": " + Math.round(100 * prop[1] / vote.totalRolls) + '%';
}
function printBallotResult() {
    let superMajority = 80.00;
    let acceptance = 100 * vote.result.yay / (vote.result.yay + vote.result.nay);
    let quorum = vote.quorum / 100;
    let participation = 100 * (vote.result.yay + vote.result.nay + vote.result.pass) / vote.totalRolls;
    let res = safeRound(superMajority, acceptance);
    superMajority = res[0];
    acceptance = res[1];
    res = safeRound(quorum, participation);
    quorum = res[0];
    participation = res[1];
    $(target).append(wrap("Acceptance: " + acceptance + '% ' + '/ ' + superMajority + '%'));
    $(target).append(wrap("Participation: " + participation + '% ' + '/ ' + quorum + '%'));
    addVotesLink();
}
function printTesting() {
    $(target).append('<BR>' + wrap('<a href="https://forum.tezosagora.org/c/proposals" target="_blank">Join the discussion!</a>'));
    addVotesLink();
}
function safeRound(a, b) {
    for (let n = 1; n < 5000000; n = n * 10) {
        if (Math.round(a * n)/n - Math.round(b * n)/n !== 0) {
            return [Math.round(a * n)/n, Math.round(b * n)/n];
        }
    } return [a, b];
}
function addVotesLink() {
    $(target).append("<a href=\"./votes\"><h9 id=\"votesLink\" class=\"boxdescription float-right\">tezos.help/votes</h9></a>");
}