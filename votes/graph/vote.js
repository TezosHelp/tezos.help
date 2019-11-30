let Title = "";
let cacheMap = new Map();
let vote;
$('document').ready(function () {
	const hash = $(location).attr('hash');
	if (hash && hash.length > 1 && hash.slice(0, 1) === '#' && Number(hash.slice(1, hash.length))) {
		const period = Number(hash.slice(1, hash.length));
		init(period);
	} else {
		init();
	}
});
window.onhashchange = function() {
	$('#chart').html("")
	const hash = $(location).attr('hash');
	const period = Number(hash.slice(1,hash.length));
	init(period);
}
async function init(period) {
	let votes;
	if (cacheMap.has(period)) {
		vote = await cacheMap.get(period);
		preLoadNeighbours();
	}
	else {
		vote = await newVotingPeriod(period);
		if (vote.lastBlock === 'head') {
			history.replaceState(null, null, ' ');
		}
		await vote.getVotingData();
		preLoadNeighbours();
		if (vote.lastBlock !== 'head') {
			cacheMap.set(period, vote);
		}
	}
	const url = window.location.pathname;
	Title = "";
	if (vote.votingPeriod > 10)
		Title += "<a target='_self' href='" + url + "#" + (vote.votingPeriod - 1) + "'><img class=\"arrow\" src=\"../../assets/pictures/arrow-left.svg\"></a>";
	else
	Title += "<a target='_self' class=\"disabled\" href='" + url + "#" + (vote.votingPeriod - 1) + "'><img class=\"arrow\" src=\"../../assets/pictures/arrow-left.svg\"></a>";
	Title += "<div id='title'><center>" + vote.title + " (" + vote.votingPeriod + ")</center></div>";
	if (vote.lastBlock != 'head')
		Title += "<a target='_self' href='" + url + "#" + (vote.votingPeriod + 1) + "'><img class=\"arrow\" src=\"../../assets/pictures/arrow-right.svg\"></a>";
	else
		Title += "<a target='_self' class=\"disabled\" href='" + url + "#" + (vote.votingPeriod + 1) + "'><img class=\"arrow\" src=\"../../assets/pictures/arrow-right.svg\"></a>";
	$('#periodScope').html("<div class='testingTitle'>" + Title + "</div>");
	if (vote instanceof Testing) {
		printMessage("No data to display for testing periods");
	} else {
		const maxVotes = getMaxVotes(vote.bakers);
		if (vote instanceof BallotVote) {
			votes = [[0, 'pass', vote.getLastBlock()]];
			for (const ballot of vote.votes) {
				const index = vote.bakers.findIndex(b => b.pkh === ballot.source);
				votes.push([vote.bakers[index].rolls, ballot.ballot, ballot.block_level]);
			}
			drawBallotChart(votes, maxVotes, vote.quorum / 10000);
		} else if (vote instanceof ProposalVote) {
			votes = [];
			for (const proposal of vote.votes) {
				const index = vote.bakers.findIndex(b => b.pkh === proposal.source);
				votes.push([vote.bakers[index].rolls, proposal.proposal, proposal.block_level]);
			}
			drawProposalChart(votes, vote.result, maxVotes);
		}
	}

}
function preLoadNeighbours() {
	if (vote.votingPeriod > 10)
		preLoad(vote.votingPeriod - 1);
	if (vote.votingPeriod > 11) 
		preLoad(vote.votingPeriod - 2);
	if (vote.lastBlock !== 'head') {
		preLoad(vote.votingPeriod + 1).then(() =>{
			if (cacheMap.has(vote.votingPeriod + 1) && cacheMap.get(vote.votingPeriod + 1).lastBlock !== 'head')
				preLoad(vote.votingPeriod + 2);
		});
		
	}
}
async function preLoad(period) {
	if (!cacheMap.has(period)) {
		const preVote = await newVotingPeriod(period);
		if (preVote.lastBlock !== 'head') {
			await preVote.getVotingData();
			cacheMap.set(period, preVote);
		}
	}
}
function getMaxVotes(bakers) {
	count = 0;
	for (const baker of bakers) {
		count += baker.rolls;
	}
	return count;
}
function printMessage(message) {
	$('#chart').html("<center><BR><BR><BR><BR>" + message + "</center>");
}
function drawProposalChart(votes, result, maxVotes) {
	if (votes.length < 1) {
		printMessage("No proposal votes");
		return null;
	}
	const startBlock = votes[0][2] - (votes[0][2] % 32768);
	let chartData = [];
	let data = [];
	votes.reverse();
	for (proposal of result) {
		votes.push([0, proposal[0], vote.getLastBlock()]);
	}
	for (let i = 0; i < result.length; i++) {
		let tot = 0;
		chartData.push({ proposal: result[i][0], x: [], y: [] });
		for (let vote of votes) {
			if (result[i][0].includes(vote[1])) {
				tot += vote[0];
				const x = Math.round(((vote[2] - startBlock) * 10000) / 32768) / 100;
				const y = Math.round((10000 * tot) / maxVotes) / 100;
				chartData[i].x.push(x);
				chartData[i].y.push(y);
			} else if (tot > 0) {
				const x = Math.round(((vote[2] - startBlock) * 10000) / 32768) / 100;
				const y = Math.round((10000 * tot) / maxVotes) / 100;
				chartData[i].x.push(x);
				chartData[i].y.push(y);
			}
		}
		var trace = {
			x: chartData[i].x,
			y: chartData[i].y,
			mode: 'lines',
			name: proposalHash2alias(chartData[i].proposal),
			line: {
				width: 3
			},
			hovertemplate: '%{y}%'
		};
		var result0 = {
			x: [chartData[i].x[chartData[i].x.length - 1]],
			y: [chartData[i].y[chartData[i].y.length - 1]],
			type: 'scatter',
			mode: 'markers',
			name: 'Currently',
			showlegend: false,
			hoverinfo: 'skip',
			marker: {
				color: 'rgb(0, 0, 0)',
				size: 7,
			}
		};
		data.push(trace);
		data.push(result0);
	}
	var layout = {
		xaxis: {
			range: [0, 101],
			domain: [0, 0.98],
			title: 'time (%)',
			tickmode: "linear",
			tick0: 0,
			dtick: 5
		},
		yaxis: {
			range: [0, 101],
			title: 'Upvotes (%)',
			tickmode: "linear",
			tick0: 0,
			dtick: 5
		},/*
		yaxis2: {
			range: [0, 101],
			title: '',
			titlefont: { color: 'rgb(0, 0, 0)' },
			tickfont: { color: 'rgb(0, 0, 0)' },
			tickmode: "linear",
			tick0: 0,
			dtick: 5,
			anchor: 'x',
			overlaying: 'y',
			side: 'right'
		},*/
		annotations: []
	};
	Plotly.newPlot('chart', data, layout);
}
function drawBallotChart(chartData, maxVotes, quorum) {
	if (chartData.length < 1) {
		printMessage("No ballot votes");
		return null;
	}
	let yTot = 0;
	let yYay = 0;
	let yNay = 0;
	var x1 = [];
	var y1 = [];
	var x2 = [];
	var y2 = [];
	var x3 = [];
	var y3 = [];
	var y4 = [];
	const startBlock = chartData[0][2] - (chartData[0][2] % 32768);
	x3.push(0);
	y3.push(100 * quorum);
	y4.push(80);
	for (var i = chartData.length - 1; i >= 0; i--) {
		if (chartData[i].length === 3) {
			yTot = yTot + chartData[i][0];
			switch (chartData[i][1]) {
				case 'yay':
					yYay += chartData[i][0];
					break;
				case 'nay':
					yNay += chartData[i][0];
					break;
				default:
			}
			y1.push(Math.round((10000 * yTot) / maxVotes) / 100);
			var xValue = Math.round(((chartData[i][2] - startBlock) * 10000) / 32768) / 100;
			x1.push(xValue);
			x2.push(xValue);
			x3.push(xValue);
			y3.push(100 * quorum);
			y4.push(80);
			y2.push(Math.round((10000 * yYay) / (yYay + yNay)) / 100);
		}
	}
	x3.push(100);
	y3.push(100 * quorum);
	y4.push(80);
	// 32768
	var trace1 = {
		x: x1,
		y: y1,
		mode: 'lines',
		name: 'Participation',
		line: {
			width: 3,
			color: 'rgb(0, 0, 153)'
		},
		hovertemplate: '%{y}%'
	};
	var trace2 = {
		x: x2,
		y: y2,
		mode: 'lines',
		yaxis: 'y2',
		name: 'Acceptance',
		line: {
			width: 3,
			color: 'rgb(0, 153, 0)'
		},
		hovertemplate: '%{y}%'
	};
	var trace3 = {
		x: x3,
		y: y3,
		mode: 'lines',
		name: 'Quorum',
		line: {
			dash: 'dot',
			width: 3,
			color: 'rgb(0, 0, 153)'
		},
		hovertemplate: '%{y}%'
	};
	var trace4 = {
		x: x3,
		y: y4,
		mode: 'lines',
		yaxis: 'y2',
		name: 'Supermajority',
		line: {
			dash: 'dot',
			width: 3,
			color: 'rgb(0, 153, 0)'
		},
		hovertemplate: '%{y}%'
	};
	var data = [trace2, trace4, trace1, trace3];
	var result0 = {
		x: [x1[x1.length - 1]],
		y: [y1[y1.length - 1]],
		type: 'scatter',
		mode: 'markers',
		name: 'Currently',
		showlegend: false,
		hoverinfo: 'skip',
		marker: {
			color: 'rgb(0, 0, 153)',
			size: 7,
		}
	};
	var result00 = {
		x: [x2[x2.length - 1]],
		y: [y2[y2.length - 1]],
		type: 'scatter',
		mode: 'markers',
		yaxis: 'y2',
		name: 'Currently',
		showlegend: false,
		hoverinfo: 'skip',
		marker: {
			color: 'rgb(0, 153, 0)',
			size: 7
		}
	};
	data.push(result0, result00);
	var layout = {
		xaxis: {
			range: [0, 101],
			domain: [0, 0.96],
			title: 'time (%)',
			tickmode: "linear",
			tick0: 0,
			dtick: 5
		},
		yaxis: {
			range: [0, 101],
			title: 'Participation (%)',
			titlefont: { color: 'rgb(0, 0, 153)' },
			tickfont: { color: 'rgb(0, 0, 153)' },
			tickmode: "linear",
			tick0: 0,
			dtick: 5
		},
		yaxis2: {
			range: [0, 101],
			title: 'Acceptance (%)',
			titlefont: { color: 'rgb(0, 153, 0)' },
			tickfont: { color: 'rgb(0, 153, 0)' },
			tickmode: "linear",
			tick0: 0,
			dtick: 5,
			anchor: 'x',
			overlaying: 'y',
			side: 'right'
		},
		annotations: []
	};
	/*var result1 = {
		xref: 'paper',
		x: (x1[x1.length-1]+0.5)/100,
		y: y1[y1.length-1],
		xanchor: 'left',
		yanchor: 'middle',
		text: y1[y1.length-1] +'%',
		font: {
		  family: 'Arial',
		  size: 16,
		  color: 'black'
		},
		bgcolor: '#FFFFFF',
		showarrow: false
	};
		var result2 = {
		xref: 'paper',
		x: (x2[x2.length-1] + 0.5)/100,
		y: y2[y2.length-1],
		yref: 'y2',
		xanchor: 'left',
		yanchor: 'middle',
		text: y2[y2.length-1] +'%',
		font: {
		  family: 'Arial',
		  size: 16,
		  color: 'black'
		},
		bgcolor: '#FFFFFF',
		showarrow: false
	};
	layout.annotations.push(result2, result1);*/
	Plotly.newPlot('chart', data, layout);
}