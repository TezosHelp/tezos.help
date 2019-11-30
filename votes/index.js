let cacheMap = new Map();
let vote;
$('document').ready(function(){
	const hash = $(location).attr('hash');
	if (hash && hash.length > 1 && hash.slice(0,1) === '#' && Number(hash.slice(1,hash.length))) {
		const period = Number(hash.slice(1,hash.length));
		init(period);
	} else {
		init();
	}
});
async function init(period) {
	if (cacheMap.has(period)) {
		vote = await cacheMap.get(period); // Get from cache
		console.log('Loading period ' + period);
		if (vote.lastBlock === 'head') {
			vote.loop(true);
		}
		preLoadNeighbours();
	} else {
		vote = await newVotingPeriod(period);
		await vote.getVotingData();
		preLoadNeighbours();
		cacheMap.set(vote.votingPeriod, vote);
		console.log('Loading period ' + vote.votingPeriod);
	}
	updateArrowLinks(vote.votingPeriod);
	if (vote.lastBlock === 'head') {
		history.replaceState(null, null, ' ');
	}
    vote.show();
	vote.run();
}
function preLoadNeighbours() {
	if (vote.votingPeriod > 10)
		preLoad(vote.votingPeriod - 1);
	if (vote.votingPeriod > 11) 
		preLoad(vote.votingPeriod - 2);
	if (vote.lastBlock !== 'head') {
		preLoad(vote.votingPeriod + 1).then(() =>{
			if (cacheMap.get(vote.votingPeriod + 1).lastBlock !== 'head')
				preLoad(vote.votingPeriod + 2);
		});
		
	}
}
async function preLoad(period) {
	if (!cacheMap.has(period)) {
		const preVote = await newVotingPeriod(period);
		await preVote.getVotingData();
		cacheMap.set(period, preVote);
		// console.log("store period " + period);
	}
}
window.onhashchange = function() {
	$('.voteInfo #right').addClass("disabled");
	$('.voteInfo #left').addClass("disabled");
	vote.clear();
	const hash = $(location).attr('hash');
	const period = Number(hash.slice(1,hash.length));
	init(period);
}
function updateArrowLinks(period) {
	const left = period - 1;
	const right = period + 1;
	$(".voteInfo #left").prop("href", "#" + left);
	$(".voteInfo #right").prop("href", "#" + right);
	$("#graphLink").prop("href", "./graph#" + period);
}