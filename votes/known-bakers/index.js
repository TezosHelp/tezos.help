let token = '';
async function generateMap() { // update
	let args = window.location.search.substr(1);
	if (args.length > 6 && args.slice(0, 6) === 'token=') {
		token = args.slice(6);
	}
	const promises = [initBakers(), registryBakers(), bakingBadBakers(), myTezosBakers(), localBakers()];
	const bakerSource = await Promise.all(promises)
	const oldBakers = bakerSource[0];
	let bakers = bakerSource[1];
	bakers = append(bakers, bakerSource[2]);
	bakers = append(bakers, bakerSource[3]);
	bakers = append(bakers, bakerSource[4]);
	diff = [];
	for (b of bakers) {
		if (!oldBakers.some(ob => ob.pkh === b.pkh)) {
			diff.push(b);
		} else if (b.logo || b.offchainData) {
			const index = oldBakers.findIndex(ob => ob.pkh === b.pkh);
			if (JSON.stringify(oldBakers[index]) !== JSON.stringify(b)) {
				diff.push(b);
			}
		}
	}
	if (diff.length > 20) {
		diff.length = 20;
	}
	bakers = diff;
	await addBakers(diff);
	let bakersOut = "";
	for (var i = 0; i < bakers.length; i++) {
		const logo = bakers[i].logo ? ', "logo": "' + bakers[i].logo + '"' : '';
		bakersOut += "{\"name\": \"" + bakers[i].name + "\", \"pkh\": \"" + bakers[i].pkh + "\"" + logo + "}";
		if (i + 1 < bakers.length) {
			bakersOut += ",\n";
		}
	}
	$("#container").append(bakersOut);
}
async function initBakers() {
	const d = await fetch('bakers.json?' + getTS()).then(function (ans) {
		return ans.json();
	});
	return d;
}
function addIcons(bakers) {
	for (const i in bakers) {
		const index = iconMap.findIndex(a => a.identity === bakers[i].pkh);
		if (index !== -1 && iconMap[index].image) {
			bakers[i].image = iconMap[index].image;
		}
	}
	return bakers;
}
function append(a, b) {
	const c = a;
	const initSize = a.length;
	for (const baker of b) {
		if (!a.some(a => a.pkh === baker.pkh)) { // Add new baker
			c.push(baker);
		} else if (baker.logo) {
			const index = a.findIndex(a => a.pkh === baker.pkh);
			if (!a[index].logo) {
				a[index].logo = baker.logo;
			}
		}
	}
	return c;
}
async function myTezosBakers() {
	const d = await fetch('https://api.mytezosbaker.com/v1/bakers/').then(function (ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d.bakers) {
		if (b.baker_name) {
			bakers.push({ name: b.baker_name, pkh: b.delegation_code, logo: b.logo });
		}
	}
	return bakers;
}
async function bakingBadBakers() {
	const d = await fetch('https://api.baking-bad.org/v1/aliases').then(function (ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d) {
		if (b.name) {
			bakers.push({ name: b.name, pkh: b.address, logo: 'https://api.baking-bad.org/logos/' + b.logo });
		}
	}
	return bakers;
}
async function tzaBakers(period = 19) {
	const d1 = await fetch('https://www.tezosagora.org/api/v1/non_voters/' + period).then(function (ans) {
		return ans.json();
	});
	const d2 = await fetch('https://www.tezosagora.org/api/v1/ballots/' + period + '?limit=500' + period).then(function (ans) {
		return ans.json();
	});
	let bakers = [];
	for (const b of d1) {
		if (b.name) {
			bakers.push({ name: b.name, pkh: b.pkh });
		}
	}
	for (const b of d2.results) {
		if (b.author.name) {
			bakers.push({ name: b.author.name, pkh: b.author.pkh });
		}
	}
	return bakers;
}
async function registryBakers() {
	const d = await getAllRegistryBakers('https://api.staging.tzstats.com', '17').catch(function (e) {
		$("#container").append(e + " (tzstats.com)\n");
		throw new Error(e);
	});
	bakers = [];
	const promises = [];
	if (d) {
		for (b of d) {
			let offchainData = '';
			if (b.bakerOffchainRegistryUrl && b.bakerOffchainRegistryUrl.slice(0, 4) === 'http') {
				offchainData = b.bakerOffchainRegistryUrl;
				promises.push(getOffchainImg(b, offchainData));
			} else {
				bakers.push({ name: b.bakerName, pkh: b.bakerAccount });
			}
		}
		const offchainBakers = await Promise.all(promises);
		bakers = bakers.concat(offchainBakers);
	}
	return bakers;
}
function getOffchainImg(b, offchainData) {
	return new Promise(function (resolve, reject) {
		$.get('./jsonProxy.php?target=' + btoa(offchainData), function (data) {
			if (data && data.length > 4) {
				if (data.slice(0, 4) === 'http' && (data.slice(data.length - 4, data.length) === '.png' || data.slice(data.length - 4, data.length) === '.jpg')) {
					resolve({ name: b.bakerName, pkh: b.bakerAccount, logo: data });
				}
			}
			resolve({ name: b.bakerName, pkh: b.bakerAccount });
		}).catch(function () {
			resolve({ name: b.bakerName, pkh: b.bakerAccount });
		})
	});
}
function addBakers(bakers) {
	return new Promise(function (resolve, reject) {
		$.post('./updateBakers.php', { token: token, data: JSON.stringify(bakers) }, function (data) {
			if (data) {
				resolve(data);
			}
			resolve('');
		}).catch(function () {
			resolve('');
		})
	});
}
async function localBakers() {
	const d = await fetch('localBakerData.json').then(function (ans) {
		return ans.json();
	});
	return d;
}
function getTS() {
	return new Date().getTime();
}
$('document').ready(function () {
	generateMap();
});