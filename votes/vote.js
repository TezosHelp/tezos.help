const conseilServerInfo = { url: 'https://conseil-prod.cryptonomic-infra.tech', apiKey: 'klassare' };
const rpc = 'https://mainnet.tezos.org.ua';
async function newVotingPeriod(period) {
	let head = await conseiljs.TezosConseilClient.getBlockHead(conseilServerInfo, 'mainnet');
    let lastBlock;
	if (Number(period) && period < head.meta_voting_period && period >= 10) {
		lastBlock = 32768 * (period + 1) - 1;
		head = await conseiljs.TezosConseilClient.getBlockByLevel(conseilServerInfo, 'mainnet', lastBlock).then(
			(ans) => {
				return ans[0];
			}
		);
	} else {
		lastBlock = 'head';
	}
	const periodKind = head.period_kind;
	let vote;
	switch(periodKind) {
		case 'proposal':
			vote = new ProposalVote(head, lastBlock);
			break;
		case 'testing_vote':
			vote = new ExplorationVote(head, lastBlock);
			break;
		case 'testing':
			vote = new Testing(head, lastBlock);
			break;
		case 'promotion_vote':
			vote = new PromotionVote(head, lastBlock);
			break;
		default:
			throw new Error('No voting period "' + periodKind + '" found!');
	}
	return vote
}
class Vote {
	constructor(head, lastBlock) {
		this.updateInterval = 60000;
		this.lastBlock = lastBlock;
		this.votingPeriod = head.meta_voting_period;
		this.remainingPeriodBlocks = 32768 - head.meta_voting_period_position - 2;
		this.activeProposal = head.active_proposal;
		this.quorum = head.current_expected_quorum;
		this.queue = [];
	}
	show() {
		$(".voteInfo #votingPeriod").html(this.votingPeriod);
		$("#title").text(this.title);
		this.setCountDown();
	}
	async run() {
		this.interval = setInterval(async () => { await this.loop((this.lastBlock === 'head')) }, this.updateInterval);
		this.print();
	}
	getLastBlock() {
		if (this.lastBlock === 'head')
			return ((this.votingPeriod + 1) * 32768 - this.remainingPeriodBlocks - 1);
		else
			return this.lastBlock;
	}
	print() {
		if (this.votingPeriod > 10)
		$('.voteInfo #left').removeClass("disabled");
	if (this.lastBlock !== 'head')
		$('.voteInfo #right').removeClass("disabled");
		this.printVotingData();
		this.printRecentVotes();
	}
	async loop(live = false, divId) {
		if (live) {
			this.setCountDown(true);
			const newVotes = await this.getVotesLive(this.head);
			if (newVotes.length) {
				this.updateResult();
				this.queue = newVotes.concat(this.queue);
				this.head = this.queue[0].block_level;
				this.setQueueIndicator(this.queue.length);
			}
		}
		this.updateAge(divId);
	}
	updateAge(divId) {
		const now = new Date().getTime();
		for (let i = 0; i < this.votes.length; i++) {
			const time = $(divId + " .recentVotes #recentVote" + i).html();
			const newTime = formatTime(now - this.votes[i].timestamp);
			if (time !== newTime) {
				$(divId +  " .recentVotes #recentVote" + i).html(newTime);
			}
		}
	}
	async setCountDown(update = false) {
		if (update && this.remainingPeriodBlocks) {
			await this.updateRemainingBlocks();
		}
		if (!this.remainingPeriodBlocks) {
			$("#countDown").html("");
			$(".countDown").css("display", "none");
		} else {
			$(".countDown").css("display", "inline-block");
			$("#countDown").html(formatBlockTime(this.remainingPeriodBlocks));
		}
	}
	async updateRemainingBlocks() {
		let head = await conseiljs.TezosConseilClient.getBlockHead(conseilServerInfo, 'mainnet');
		this.remainingPeriodBlocks = 32768 - head.meta_voting_period_position - 2;
	}
	async updateResult() {
		this.result = await this.getResult();
		this.printVotingData();
	}
	async getVotingData(result = true) {
		let promises = [];
		if (result) {
			promises.push(this.getResult());
		}
		promises.push(this.getVotes(this.votingPeriod));
		promises.push(this.getRollCount());
		await Promise.all(promises)
			.then(res => {
				let i = -1;
				if (result) {
					this.result = res[++i];
				}
				this.votes = res[++i];
				this.bakers = res[++i].bakers;
				this.totalRolls = res[i].totalRolls;
			});
	}
	async getRollCount() {
		const bakers = await fetch(rpc + '/chains/main/blocks/' + this.lastBlock + '/votes/listings')
			.then(function(ans) {return ans.json();});
		/* Stopped working
		const platform = 'tezos';
		const network = 'mainnet';
		const entity = 'rolls';
		let transactionQuery = conseiljs.ConseilQueryBuilder.blankQuery();
		transactionQuery = conseiljs.ConseilQueryBuilder.addFields(transactionQuery, 'pkh', 'rolls');
		transactionQuery = conseiljs.ConseilQueryBuilder.addPredicate(transactionQuery, 'block_level', conseiljs.ConseilOperator.EQ, [this.getLastBlock()], false);
		transactionQuery = conseiljs.ConseilQueryBuilder.setLimit(transactionQuery, 5000);
		const bakers = await conseiljs.ConseilDataClient.executeEntityQuery(conseilServerInfo, platform, network, entity, transactionQuery);
		*/
		let totalRolls = 0;
		for (let i = 0; i < bakers.length; i++) {
			totalRolls += bakers[i].rolls;
		}
		return {bakers, totalRolls}
	}
	setQueueIndicator(count) {
		if (Number.isInteger(count) && count > 0){
			document.title = "(" + count + ") Vote stats";
			$(".buttonholder").css("visibility", "visible");
			$(".buttonholder button").html('Load new votes <span class="badge badge-light">' + count + "</span>");
		} else {
			document.title = "Vote stats";
			$(".buttonholder").css("visibility", "hidden");
		}
	}
	clearQueue() {
		this.votes = this.queue.concat(this.votes);
		this.queue = [];
		this.printRecentVotes();
		this.setQueueIndicator(0);
		return false;
	}
	clear() {
		clearInterval(this.interval);
		this.setQueueIndicator(0);
		this.queue = [];
	}
}
class ProposalVote extends Vote {
	constructor(head, lastBlock) {
		super(head, lastBlock);
		this.title = "Proposal vote";
		this.type = 0;
	}
	show() {
		$("#h1").addClass("active");
		$("#p1").css("display", "inline-block");
		super.show();
	}
	loop(live) {
		super.loop(live, "#p1");
	}
	async getResult() {
		const proposalResult = await fetch(rpc + '/chains/main/blocks/' + this.lastBlock + '/votes/proposals')
			.then(function(ans) {return ans.json();});
		return proposalResult;
	}
	async getVotes(votingPeriod, n = 500) {
		let query = conseiljs.ConseilQueryBuilder.blankQuery();
		query = conseiljs.ConseilQueryBuilder.addFields(query, 'source', 'timestamp', 'proposal', 'block_level');
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'kind', conseiljs.ConseilOperator.EQ, ['proposals'], false);
		const votingPeriodLength = 32768;
		const startBlock = votingPeriodLength * votingPeriod + 1;
		const endBlock = votingPeriodLength * (votingPeriod + 1);
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'block_level', conseiljs.ConseilOperator.BETWEEN, [startBlock - 1, endBlock + 1], false);
		query = conseiljs.ConseilQueryBuilder.addOrdering(query, 'block_level', conseiljs.ConseilSortDirection.DESC);
		query = conseiljs.ConseilQueryBuilder.setLimit(query, n);
		let proposals = await conseiljs.TezosConseilClient.getOperations(conseilServerInfo, 'mainnet', query);
		for (const p of proposals) {
			p.proposal = p.proposal.replace(/[\[\]]/g, '');
			p.proposal = p.proposal.replace(',', "\n");
		}
		return proposals;
	}
	async getVotesLive(block) {
		let query = conseiljs.ConseilQueryBuilder.blankQuery();
		query = conseiljs.ConseilQueryBuilder.addFields(query, 'source', 'timestamp', 'proposal', 'block_level');
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'kind', conseiljs.ConseilOperator.EQ, ['proposals'], false);
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'block_level', conseiljs.ConseilOperator.BETWEEN, [block + 1, block + 35000], false);
		query = conseiljs.ConseilQueryBuilder.addOrdering(query, 'block_level', conseiljs.ConseilSortDirection.DESC);
		query = conseiljs.ConseilQueryBuilder.setLimit(query, 500);
		let proposals = await conseiljs.TezosConseilClient.getOperations(conseilServerInfo, 'mainnet', query);
		for (const p of proposals) {
			p.proposal = p.proposal.replace(/[\[\]]/g, '');
			p.proposal = p.proposal.replace(',', "\n");
		}
		return proposals;
	}
	printVotingData() {
		$("#p1 #proposals").html("");
		if (this.result.length === 0) {
			$("#p1 #proposals").append("<tr><td>No proposals yet...</td><td>-</td><td>-</td></tr>");
		}
		for (var i = 0; i < this.result.length; i++) {
			let proposalLabel = proposalHash2alias(this.result[i][0], true)
			if (proposalLabel !== this.result[i][0]) {
				if (proposalLabel.url)
					proposalLabel = '<a href="' + proposalLabel.url + '" target="_blank">' +proposalLabel.alias + '</a> - ' + this.result[i][0];
				else
					proposalLabel = proposalLabel + ' - ' + this.result[i][0];
			}
			$("#p1 #proposals").append("<tr><td>" + proposalLabel + "</td><td>" + this.result[i][1].toLocaleString() + "</td><td id=\"percentage" + i + "\"></td></tr>");
		}
		for (var i = 0; i < this.result.length; i++) {
			$('#p1 #proposals #percentage' + i).html(Math.round((10000*this.result[i][1])/this.totalRolls)/100+'%');
		}
	}
	printRecentVotes() {
		$("#p1 .RecentVotes").html("");
		const now = new Date().getTime();
		
		if (this.votes && this.votes.length) {
			$("#p1 .RecentVotesHead").show();
			for (const i in this.votes) {
				$("#p1 .RecentVotes").append("<tr><td id=\"recentVote" + i + "\">" + formatTime(now - this.votes[i].timestamp) + "</td><td>"
				+pkh2alias(this.votes[i].source)+"</td><td>"+ bakerRolls(this.votes[i].source, this.bakers).toLocaleString() + "</td><td>"
				+ proposalHash2alias(this.votes[i].proposal) +"</td></tr>");
			}
			this.head = this.votes[0].block_level;
		} else {
			$("#p1 .RecentVotesHead").hide();
		}
	}
	clear() {
		super.clear();
		$("#p1 .RecentVotes").html("");
		$("#p1 #proposals").html("");
		$("#h1").removeClass("active");
		$("#p1").css("display", "none");
	}
}
class Testing extends Vote {
	constructor(head, lastBlock) {
		super(head, lastBlock);
		this.title = "Testing phase";
		this.type = 2;
	}
	show() {
		$("#h3").addClass("active");
		this.run();
		super.show();
	}
	clear() {
		super.clear();
		$("#h3").removeClass("active");
	}
	run() {
		if (this.votingPeriod > 10)
			$('.voteInfo #left').removeClass("disabled");
		if (this.lastBlock !== 'head')
			$('.voteInfo #right').removeClass("disabled");
	}
	getResult() {}
	getVotes() {}
	getVotingData() {}
	printVotingData() {}
	printRecentVotes() {}
	async loop() {}
}
class BallotVote extends Vote {
	constructor(head, lastBlock) {
		super(head, lastBlock);
		// this.run();
	}
	show() {
		$("#p2").css("display", "inline-block");
		super.show();
	}
	loop(live) {
		super.loop(live, "#p2");
	}
	async getResult() {
		const ballotResult = await fetch(rpc + '/chains/main/blocks/' + this.lastBlock + '/votes/ballots')
			.then(function(ans) {return ans.json();});
		return ballotResult;
	}
	async getVotes(votingPeriod, n = 500) {
		let query = conseiljs.ConseilQueryBuilder.blankQuery();
		query = conseiljs.ConseilQueryBuilder.addFields(query, 'source', 'timestamp', 'ballot', 'block_level');
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'kind', conseiljs.ConseilOperator.EQ, ['ballot'], false);
		const votingPeriodLength = 32768;
		const startBlock = votingPeriodLength * votingPeriod + 1;
		const endBlock = votingPeriodLength * (votingPeriod + 1);
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'block_level', conseiljs.ConseilOperator.BETWEEN, [startBlock - 1, endBlock + 1], false);
		query = conseiljs.ConseilQueryBuilder.addOrdering(query, 'block_level', conseiljs.ConseilSortDirection.DESC);
		query = conseiljs.ConseilQueryBuilder.setLimit(query, n);
		let ballots = await conseiljs.TezosConseilClient.getOperations(conseilServerInfo, 'mainnet', query);
		return ballots;
	}
	async getVotesLive(block) {
		let query = conseiljs.ConseilQueryBuilder.blankQuery();
		query = conseiljs.ConseilQueryBuilder.addFields(query, 'source', 'timestamp', 'ballot', 'block_level');
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'kind', conseiljs.ConseilOperator.EQ, ['ballot'], false);
		query = conseiljs.ConseilQueryBuilder.addPredicate(query, 'block_level', conseiljs.ConseilOperator.BETWEEN, [block + 1, block + 35000], false);
		query = conseiljs.ConseilQueryBuilder.addOrdering(query, 'block_level', conseiljs.ConseilSortDirection.DESC);
		query = conseiljs.ConseilQueryBuilder.setLimit(query, 500);
		let ballots = await conseiljs.TezosConseilClient.getOperations(conseilServerInfo, 'mainnet', query);
		return ballots;
	}
	printVotingData() {
		this.clearProgressBars();
		$('#p2 .a2').html(this.result.yay.toLocaleString());
		$('#p2 .b2').html(this.result.nay.toLocaleString());
		$('#p2 .c2').html(this.result.pass.toLocaleString());
		const voted = this.result.yay + this.result.nay + this.result.pass;
		const yesPercentage = Math.round(10000*this.result.yay/(this.result.yay + this.result.nay))/100;
		$('#p2 .a3').html(Math.round(10000*this.result.yay/(this.result.yay + this.result.nay))/100+'%');
		$('#p2 .b3').html(Math.round(10000*this.result.nay/(this.result.yay + this.result.nay))/100+'%');
		$('#p2 .c3').html('-');
		$('#p2 .f3').html(this.quorum/100+'%');
		$('#p2 .g2').html(Math.round((this.result.yay + this.result.nay)*this.quorum/10000).toLocaleString());
		
		/* Progress bars */
		$('#progress2 .bar-step').css('left', this.quorum / 100 + '%');
		$('#progress2 .label-percent').html(this.quorum / 100 + '%');
		$('#progress1 .progress-bar').css('width', yesPercentage+'%');
		$('#progress1 .progress-bar').html(yesPercentage+'%');
		if (yesPercentage > 80) {
			$('#progress1 .progress-bar').addClass("progress-bar-success");
		} else if (yesPercentage > 40) {
			$('#progress1 .progress-bar').addClass("progress-bar-warning");
		} else {
			$('#progress1 .progress-bar').addClass("progress-bar-danger");
		}
		$('#p2 .d2').html(voted.toLocaleString());
		const votesPercentage = Math.round(10000*voted/(this.totalRolls))/100;
		$('#p2 .d3').html(votesPercentage+'%');
		$('#p2 .e2').html((this.totalRolls - voted).toLocaleString());
		$('#p2 .e3').html(Math.round(10000*(this.totalRolls - voted)/(this.totalRolls))/100+'%');
		$('#p2 .f2').html(Math.round(this.totalRolls * (this.quorum / 10000) + 0.5).toLocaleString());
		$('#progress2 .progress-bar').css('width', votesPercentage+'%');
		$('#progress2 .progress-bar').html(votesPercentage+'%');
		if (votesPercentage >= this.quorum/100) {
			$('#progress2 .progress-bar').addClass("progress-bar-success");
		} else if (votesPercentage >= this.quorum / 200) {
			$('#progress2 .progress-bar').addClass("progress-bar-warning");
		} else {
			$('#progress2 .progress-bar').addClass("progress-bar-danger");
		}
	}
	printRecentVotes() {
		const now = new Date().getTime();
		$("#p2 .RecentVotes").html("");
		if (this.votes && this.votes.length) {
			for (const i in this.votes) {
				$("#p2 .RecentVotes").append("<tr><td id=\"recentVote" + i + "\">" + formatTime(now - this.votes[i].timestamp) + "</td><td>"+pkh2alias(this.votes[i].source)+"</td><td>"
				+ bakerRolls(this.votes[i].source, this.bakers).toLocaleString() + "</td><td class=\"" + this.votes[i].ballot + "\">"
				+ this.votes[i].ballot +"</td></tr>");
			}
			this.head = this.votes[0].block_level;
		}
	}
	clear() {
		super.clear();
		$("#p2").css("display", "none");
		$("#p2 .RecentVotes").html("");
		$("#h4").removeClass("active");
		this.clearProgressBars();
	}
	clearProgressBars() {
		$('#progress1 .progress-bar').removeClass("progress-bar-success");
		$('#progress1 .progress-bar').removeClass("progress-bar-warning");
		$('#progress1 .progress-bar').removeClass("progress-bar-danger");
		$('#progress2 .progress-bar').removeClass("progress-bar-success");
		$('#progress2 .progress-bar').removeClass("progress-bar-warning");
		$('#progress2 .progress-bar').removeClass("progress-bar-danger");
	}
}
class ExplorationVote extends BallotVote {
	constructor(head, lastBlock) {
		super(head, lastBlock);
		this.title = "Exploration vote";
		this.type = 1;
		// this.show();
	}
	show() {
		$("#h2").addClass("active");
		super.show();
	}
	clear() {
		$("#h2").removeClass("active");
		super.clear();
	}
}
class PromotionVote extends BallotVote {
	constructor(head, lastBlock) {
		super(head, lastBlock);
		this.title = "Promotion vote";
		this.type = 3;
		// this.show();
	}
	show() {
		$("#h4").addClass("active");
		super.show();
	}
	clear() {
		$("#h4").removeClass("active");
		super.clear();
	}
}
/* Utils */
 function formatTime(ms) {
	let output = "";
	// return ms;
	if (ms < 1000 * 60 * 60) { // less than 1 hour
		output = Math.round(ms / (1000 * 60)) + " minutes";
	} else if (ms < 1000 * 60 * 60 * 24) { //less than a day
		output = Math.round(ms / (1000 * 60 * 60)) + " hours";
	} else {
		output = Math.round(ms / (1000 * 60 * 60 * 24)) + " days";
	}
	return output;
 }
 function formatBlockTime(blocks) {
 	var minutes = blocks % 60;
	var hours = (blocks - minutes) / 60;
	var days = (hours - hours % 24) / 24;
	hours = hours % 24;
	if (days === 0) {
		if (minutes === 0) {
			return '';
		}
		return hours + " hours " + minutes + " minutes";
	} else {
		return days + " days " + hours + " hours";
	}
}
 function bakerRolls(baker, bakers) {
	const index = bakers.findIndex(b => b.pkh === baker);
	if (index >= 0)
		return bakers[index].rolls;
	else
		return 0;
}
function pkh2alias(pkh) {
	const index = mapOfPublicBakers.findIndex(b => b.pkh === pkh);
	if (index >= 0)
		return mapOfPublicBakers[index].name;
	return pkh;
}
function getIcon(pkh) {
	const index = mapOfPublicBakers.findIndex(b => b.pkh === pkh);
	if (index >= 0 && mapOfPublicBakers[index].logo) {
		const subfix = mapOfPublicBakers[index].logo.slice(-4);
		if (subfix === '.jpg' || subfix === '.png') {
			return "assets/pictures/bakers/" + mapOfPublicBakers[index].pkh + subfix;
		}
	}
	return '';
}
function proposalHash2alias(hash, appendLink = false) {
	const index = proposalMap.findIndex(p => p.hash === hash);
	if (index >= 0) {
		if (appendLink && proposalMap[index].url)
			return {alias: proposalMap[index].alias, url: proposalMap[index].url}
		return proposalMap[index].alias;
	} else if (hash.includes("\n")) {
		const hashArray = hash.split("\n");
		let appendedHash = "";
		for (let i = 0; i < hashArray.length; i++) {
			appendedHash += proposalHash2alias(hashArray[i]);
			if (i + 1 < hashArray.length) {
				appendedHash += "<BR>";
			}
		}
		return appendedHash;
	}
	return hash
}