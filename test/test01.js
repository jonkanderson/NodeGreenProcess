/*
 * This file tests the combination of multiple running GreenProcess'es.  The 
 * common information must remain separate.  The threads should interleave.
 */

'use strict';

// This hack allows the test to run in a browser as well as in Node.js.
var GP;
if (typeof require !== 'undefined') {
	GP = require("../GreenProcess.js");
} else {
	GP = exports;
}

/* This sequence simply counts from 1 to 20 and gathers them. */
const simpleSequence = (new GP.GreenChunkSequence())
	.init((common)=>{
		common.arr = new Array();
	}).onError((proc, err)=>{
		console.log("--- An error occurred.");
		console.log(err);
}).then((proc)=>{
	console.log("AA: Simple start.");
	return {from:1, to:20, by:1};
}).repeatWithFromToBy((proc, i)=>{
	console.log("AA: "+i);
	proc.common.arr.push(i);
}).then((proc)=>{
	console.log("AA: Simple end.");
	return proc.common.arr;
}).end();

/* This sequence contains an intended error, uses return values, and calls an async callback. */
const complicatedSequence = (new GP.GreenChunkSequence())
	.init((common)=>{
		common.id = "Unknown-";
	}).onError((proc, err)=>{
		console.log("--------------------- An error occurred in "+proc.common.id);
		console.log(err);
}).then((proc)=>{
	console.log(proc.common.id+"A: Starting");
	return {from:0, to:9, by:2};
}).repeatWithFromToBy((proc, i)=>{
	// Between values of i, other threads may come in.
	console.log(proc.common.id+"B: "+i);
	// The second green process has id:"Y__".
	if ((proc.common.id==="Y__") && (i===6)) {
		fooERROR();
	}
}).then((proc)=>{
	console.log(proc.common.id+"C: Ended loop ("+proc.retValue+") ... going to waste some time...");
	return "Returned from C."
}).then((proc)=>{
	// Call suspend first if you start an async callback in this chunk.
	// Remember that this suspend only controls this green thread and not the nodejs running process.
	proc.suspend();
	setTimeout(()=>{
		console.log(proc.common.id+"D: Times up.");
		proc.retValue = "Returned from D.";
		proc.resume(); // Now the green thread can resume.
	}, 2000);
	return "This message should have been replaced."
}).then((proc)=>{
	let msg = proc.common.id+"E: Ending ("+proc.retValue+")";
	console.log(msg);
	return msg+" -- returned from sequence.";
}).end();

/* Start three processes. */
var p1 = new GP.GreenProcess();
p1.push(complicatedSequence.newFrame({id:"X_"})).resume();
p1.withRetValueDo(function(r) { console.log(r);} );

var p2 = new GP.GreenProcess();
p2.push(complicatedSequence.newFrame({id:"Y__"})).resume();
p2.withRetValueDo(function(r) { console.log(r);} );

var p3 = new GP.GreenProcess();
p3.push(simpleSequence.newFrame({})).resume();
p3.withRetValueDo(function(r) { console.log("AA: "+JSON.stringify(r)); });
