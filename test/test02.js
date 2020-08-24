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
	console.log("Start thenRepeatFromToBy().");
}).thenRepeatFromToBy(1, 6, 2, (proc, i)=>{
	console.log(i);
}).then((proc)=>{
	console.log("Start thenRepeatFromToByInRet().");
	return {from:3, to:12, by:3};
}).thenRepeatFromToByInRet((proc, i)=>{
	console.log(i);
}).then((proc)=>{
	console.log("Start thenRepeatKeysAndValues().");
	return {a:"This is A", b:"This is B", c:"And finally C"};
}).thenRepeatKeysAndValuesWithRet((proc, k, v)=>{
	console.log("Key: "+k);
	console.log("Value: "+v);
}).then((proc)=>{
	console.log("End.");
	return proc.common.arr;
}).end();

var p = new GP.GreenProcess();
p.push(seq.newFrame({})).resume();
p.withRetValueDo(function(r) { console.log(""+JSON.stringify(r)); });
