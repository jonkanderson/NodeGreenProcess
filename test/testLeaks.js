'use strict';

const { GreenProcess, GreenChunkSequence } = require("../GreenProcess.js");

const seq = (new GreenChunkSequence())
	.init((common)=>{
		common.arr = new Array();
	}).onError((proc, err)=>{
		console.log("An error occurred.");
		console.log(err);
}).thenRepeatFromToBy(1, 100, 1, (proc, i)=>{
	proc.common.arr.push(proc.common.id+" "+i);
}).then((proc)=>{
	console.log(proc.common.arr);
	setTimeout(function(){ (new GreenProcess()).push(seq.newFrame({id:proc.common.id})).resume()}, 0);
});

(new GreenProcess()).push(seq.newFrame({id:"A"})).resume();
(new GreenProcess()).push(seq.newFrame({id:"B"})).resume();
(new GreenProcess()).push(seq.newFrame({id:"C"})).resume();
