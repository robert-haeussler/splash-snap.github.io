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
	setCookie('choice', isSplash ? 'Splash' : 'Snap<i>!</i>', 365 * 20);
	success.innerHTML = 'You chose ' + (isSplash ? 'Splash' :
					    'Snap<i>!</i>') + '.';
	showPrecent(isSplash);
    } else {
	success.innerHTML = 'You have already voted.';
	showPrecent();
    }
}
function showPrecent(isSplash) {
    var precent = document.getElementById('precent');
    if (isSplash === undefined) {
	precent.innerHTML = ('' + splash / (splash + snap) * 100 +
			     '% chose Splash.')
    } else if (isSplash) {
	splash += 1;
	precent.innerHTML = ('' + splash / (splash + snap) * 100 +
			     '% agree with you on Splash.')
    } else {
	snap += 1;
	precent.innerHTML = ('' + snap / (snap + splash) * 100 +
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
