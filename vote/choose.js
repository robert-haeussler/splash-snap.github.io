function setCookie(cname, cvalue, exdays) {/*
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
*/}
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
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
function choose(isSplash) {
    document.getElementById('main').style = 'display: none;';
    var cookie = getCookie('choice');
    var success = document.getElementById('success');
    if (cookie === '') {
	setCookie('choice', isSplash ? 'splash' : 'snap', 365 * 20);
	success.innerHTML = 'You chose ' + (isSplash ? 'splash' : 'snap') + '.';
	showPrecent(isSplash);
    } else {
	success.innerHTML = 'You have already voted.';
	showPrecent();
    }
}
function showPrecent(isSplash) {
    var precent = document.getElementById('precent');
    var precentSplash = splash / (splash + snap);
    var precentSnap = snap / (snap + splash);
    if (isSplash === undefined) {
	precent.innerHTML = ('' + precentSplash + '% chose Splash.')
    } else if (isSplash) {
	precent.innerHTML = ('' + precentSplash + '% agree with you on Splash.')
    } else {
	precent.innerHTML = ('' + precentSnap +
			     '% agree with you on Snap<i>!</i>')
    }
}
function setup() {
    if (getCookie('choice') === '') {
	document.getElementById('main').style = '';
    } else {
	success.innerHTML = 'You have already voted.';
	showPrecent();
    }
    document.getElementById('noJs').style = 'display: none;';
}
function save(isSplash) {// transmit a vote to server
}
