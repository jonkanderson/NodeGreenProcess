/*
 * Test a connection of chunk sequences to an OOP design where sequences are analogous to methods.
 */

'use strict';

// This hack allows the test to run in a browser as well as in Node.js.
var GP;
if (typeof require !== 'undefined') {
	GP = require("../GreenProcess.js");
} else {
	GP = exports;
}

//-------------------------------------------------------------------------
const TBaseBeh = {

	_onError:(proc, err)=>{
			console.log("--- An error occurred.");
			console.log(err); },

	superThing:(new GP.GreenChunkSequence())
		.init((common)=>{})
		.onError(this._onError)
		.then((proc)=>{
			console.log("In superThing."); })
		.then((proc)=>{
			return {obj:proc.self, sel:"thisThing", args:{}}; })
		.sendMessageWithObjSelArgs()
		.then((proc)=>{
			console.log("superThing got: "+proc.retValue);
			return "Returned from superThing";})
		.end(),

	__endOfBehavior:null
}

const TFirstBeh = { __proto__:TBaseBeh,

	fooWith_and_:(new GP.GreenChunkSequence())
		.init((common)=>{})
		.onError(this._onError)
		.then((proc)=>{
			console.log("In foo."); })
		.then((proc)=>{
			return {obj:proc.self, sel:"superThing", args:{}}; })
		.sendMessageWithObjSelArgs()
		.then((proc)=>{
			console.log("Foo got: "+proc.retValue);
			return "Returned from foo";})
		.end(),

	thisThing:(new GP.GreenChunkSequence())
		.init((common)=>{})
		.onError(this._onError)
		.then((proc)=>{
			console.log("In thisThing."); })
		.then((proc)=>{
			return {from:1, to:proc.self.count, by:1}; })
		.repeatWithFromToBy((proc, i)=>{
			console.log(i); })
		.then((proc)=>{
			return "Returned from thisThing";})
		.end(),

	__endOfBehavior:null
}

//-------------------------------------------------------------------------
const mainSeq = (new GP.GreenChunkSequence())
.init((common)=>{})
.onError((proc, err)=>{
	console.log("--- An error occurred.");
	console.log(err); })
.then((proc)=>{
	console.log("Start main.");
	let obj = GP.newGreenInstance(TFirstBeh, {count: 5});
	return {obj:obj, sel:"fooWith_and_", args:{with: 111, and:"Second"}}; })
.sendMessageWithObjSelArgs()
.then((proc)=>{
	console.log("main got: "+proc.retValue);
	console.log("End main.");
	return "Returned from main";})
.end();

var p = new GP.GreenProcess();
p.push(mainSeq.newFrame({})).resume();
p.withRetValueDo(function(r) { console.log(""+JSON.stringify(r)); });
