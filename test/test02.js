/*
 * This tests various repeat processes.
 */

'use strict';

// This hack allows the test to run in a browser as well as in Node.js.
var GP;
if (typeof require !== 'undefined') {
	GP = require("../GreenProcess.js");
} else {
	GP = exports;
}

const seq = (new GP.GreenChunkSequence())
	.init((common)=>{
		common.arr = new Array();
	}).onError((proc, err)=>{
		console.log("--- An error occurred.");
		console.log(err);
}).then((proc)=>{
	console.log("Start repeatWithFromToBy(3 to 12 by 3).");
	return {from:3, to:12, by:3};
}).repeatWithFromToBy((proc, i)=>{
	console.log(i);
}).then((proc)=>{
	console.log("Start repeatWithFromToBy(-2 to 2).");
	return {from:-2, to:2};
}).repeatWithFromToBy((proc, i)=>{
	console.log(i);
}).then((proc)=>{
	console.log("Start repeatWithObjectOnKeysAndValues().");
	return {a:"This is A", b:"This is B", c:"And finally C"};
}).repeatWithObjectOnKeysAndValues((proc, k, v)=>{
	console.log("Key: "+k);
	console.log("Value: "+v);
}).then((proc)=>{
	console.log("End.");
	return proc.common.arr;
}).end();

var p = new GP.GreenProcess();
p.push(seq.newFrame({})).resume();
p.withRetValueDo(function(r) { console.log(""+JSON.stringify(r)); });
