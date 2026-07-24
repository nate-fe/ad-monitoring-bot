var live = true;

var skp_host="//idm.skplanet.com/";
var uid_name = "dmp_uid";
var nid = 13;
var dsid = 82;
var app_name = "nate_app";

function da_getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function da_setCookie(cname, cvalue, exdays) {
	var d = new Date();
	d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
	var expires = "expires=" + d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;" + "domain=.nate.com";
}

var generateUid = function (separator) {
	var delim = separator || "-";

	function S4() {
		return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
	}

	return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
};

function getAdid(u)
{
	var su = u.split(";");
	var d;
	for (i=0; i < su.length; i++) {
		d = su[i].split(":");
		if (d[0].toLowerCase() == "gadid") return d[1];
	}
	return "";
}

function getRef(u)
{
	var su = u.split(";");
	var d;
	for (i=0; i < su.length; i++) {
		d = su[i].split(":");
		if (d[0].toLowerCase() == "ref") return d[1];
	}
	return "";
}

function replaceAll(str, searchStr, replaceStr)
{
	return str.split(searchStr).join(replaceStr);
}

function padNumber(pad, num)
{
	var str = "" + num;
	return pad.substring(0, pad.length - str.length) + str;
}

var ua = navigator.userAgent;
var s = document.getElementsByTagName('script');
var ls = s[s.length-1];

var key = new Array("search_str", "tabview", "news_title", "news_cate1", "news_cate2", "news_cate3", "pann_title", "pann_cate1", "pann_cate2", "pann_cate3");
var data = new Object();
var attr;
var adid = getAdid(ua);
var os;

data["dsid"] = dsid;
data["nid"] = nid;
if (da_getCookie(uid_name) == "") {
	da_setCookie(uid_name, generateUid(), 365);
}
data["uid"] = da_getCookie(uid_name);

if (/Android/i.test(ua)) {
	os = "Android";
} else if (/Mac OS/i.test(ua)){
	os = "iOS";
} else if (/Windows/i.test(ua)) {
	os = "PC";
} else {
	os = "etc";
}

if (getRef(ua) == app_name) {
	data["channel"] = "app";

	if (/Android/i.test(ua)) {
		data["gaid"] = adid;
	} else if (/Mac OS/i.test(ua)){
		data["idfa"] = adid;
	}
} else {
	data["channel"] = "web";
}

if (data["channel"] == "app") {
	if (os == "Android") data["col011"] = 1;
	else if (os == "iOS") data["col011"] = 2;
	else if (os == "etc") data["col011"] = 3;
} else if (data["channel"] == "web") {
	if (os == "Android") data["col011"] = 4;
	else if (os == "iOS") data["col011"] = 5;
	else if (os == "etc") data["col011"] = 6;
	else if (os == "PC") data["col011"] = 7;
}

if (/Mobile/i.test(ua))
{
	if (/iPhone/i.test(ua)) {
		data["col012"] = "iPhone";
	} else if (/iPad/i.test(ua)) {
		data["col012"] = "iPad";
	} else if (/iPod/.test(ua)) {
		data["col012"] = "iPod";
	} else {
		var m = ua.split("Build")[0].split(" ");

		data["col012"] = m[m.length -2];
	}
}

for (var i=0; i < key.length; i++)
{
	if (attr = ls.getAttribute(key[i])) {
		data["col" + padNumber("000", i+1)] = attr;
	}
}

if (data.length != 0) {
	var datastr = JSON.stringify(data);

	if (!live)
	{
		console.log(datastr);
		var p = document.createElement("p");
		p.appendChild(document.createTextNode(datastr + ua));

		document.body.appendChild(p);
	} else {
		var j = document.createElement("img");
		j.src = skp_host + "collect?data=" + encodeURIComponent(JSON.stringify(data));
	}
}