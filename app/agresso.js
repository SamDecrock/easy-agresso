var httpntlm = require('httpntlm');
var async = require('async');
var httpreq = require('httpreq');
var cheerio = require('cheerio');

function getVerlof(username, password, callback){
	var verlof = {};

	async.waterfall([
		function ($){
			httpntlm.get({
				url: "https://evi.iminds.be/Agresso/System/Login.aspx",
				workstation: 'macSam.local',
				username: username,
				password: password,
				domain: ''
			}, $);
		},

		function (res, $){
			var cookies = extractCookies(res.headers);

			httpreq.get('https://evi.iminds.be/Agresso/Container.aspx?type=topgen&menu_id=RA1016&i_page_id=1016&systemplate=false&infopage=true',{
				cookies: cookies
			}, $);
		},

		function (res, $){
			verlof = parseVerlof(res.body);
			$();
		}

	], function (err){
		if(err) return callback(err);

		callback(null, verlof);
	});
}


function parseVerlof(html){
	var summary = {};
	var summaryRows = table2json(html, '#b_s4_g4s10');
	for(var r = 2; r < 6; r++){
		var row = summaryRows[r];
		var code = row[2];
		summary[code] = {
			code: code,
			codename: row[3],
			initial: parseFloat(row[4]),
			received: parseFloat(row[6]),
			left: parseFloat(row[7])
		}
	}

	var detailRows = table2json(html, '#b_s11_g11s17');
	var details = [];
	var total;
	for(var r = 2; r < detailRows.length; r++){
		var row = detailRows[r];
		if(row.length < 11)
			continue;

		if(row[1] == '∑'){
			total = parseFloat(row[row.length-1]);
			continue;
		}

		details.push({
			code: row[4],
			codename: row[5],
			start: {day: row[6], time: row[7]},
			end: {day: row[8], time: row[9]},
			amount: parseFloat(row[10])
		});
	}

	return {
		summary: summary,
		details: details,
		total: total
	};
}


function extractCookies(headers){
	var cookies = [];
	if(headers['set-cookie']){
		for(var i in headers['set-cookie']){
			var cookie = headers['set-cookie'][i];

			var realcookie = cookie.split(';')[0];
			cookies.push(realcookie);
		}
	}
	return cookies;
}

function save(str, filename){
	fs.writeFile(__dirname + '/' + filename, str, function (err) {
	    if(err) {
	        console.log(err);
	    } else {
	        console.log("The file was saved!");
	    }
	});
}

function table2json(html, tableselector){
	var rows = [];
	var $ = cheerio.load(html);
	$(tableselector).children().each(function (i, elem){
		// console.log( util.inspect(elem, { showHidden: true, depth:1, colors: true}) );

		var columns = [];

		$(elem).children().each(function (i2, elem2){
			columns.push( trim($(elem2).text()) );
		});
		rows.push(columns);
	});
	return rows;
}

function trim(str){
	str = str.replace(/\t/gi, '');
	str = str.replace(/\r/gi, '');
	str = str.replace(/\n/gi, '');
	return str;
}

exports.getVerlof = getVerlof;

