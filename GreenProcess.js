/*
Copyright (c) 2020-present Jon K. Anderson

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict';

class GreenProcess {
	constructor() {
		this._stack = [];
		this._retValue = null;
		this._activeStatus = "Not started";
		this._errorHandlers = [];
		this._retValueCallback = null;
	}

	get retValue() {
		return this._retValue;
	}
	set retValue(aValue) {
		this._retValue = aValue;
	}

	get common() {
		return this.topFrame.common;
	}

	get topFrame() {
		return this._stack[this._stack.length-1];
	}

	push(aFrame) {
		this._stack.push(aFrame);
		return this;
	}

	pop() {
		this._stack.pop();
		return this;
	}

	pushErrorHandler(aFunction) {
		this._errorHandlers.push(aFunction);
	}

	popErrorHandler() {
		this._errorHandlers.pop();
	}

	set activeStatus(aString) {
		this._activeStatus = aString;
	}

	resume() {
		if (this._activeStatus === "dead") { return null; }
		if (this._activeStatus !== "active") {
			this._activeStatus = "active";
			this.run();
		}
	}

	suspend() {
		if (this._activeStatus === "dead") { return null; }
		this._activeStatus = "suspended";
	}

	run() {
		if ((this._activeStatus === "active") && (this._stack.length>0)) {
			this.topFrame.continueProcess(this);
			if (this._stack.length === 0) {
				this._activeStatus = "dead";
				if (this._retValueCallback) {
					(function (proc) {
						setTimeout(function(){ proc._retValueCallback(proc.retValue); }, 0);
					})(this);
				}
				return null;
			}
		}
		if ((this._activeStatus === "active") && (this._stack.length>0)) {
			(function (proc) {
				// setImmediate causes memory leaks.
				//setImmediate(function(){ proc.run(); });
				setTimeout(function(){ proc.run(); }, 0);
			})(this);
		}
	}

	processError(err) {
		return (this._errorHandlers[this._errorHandlers.length-1])(this, err);
	}

	withRetValueDo(f) { this._retValueCallback = f; }
}

class GreenAbstractFrame {
	constructor(chunk, args, contFunction) {
		this._chunk = chunk;
		this._args = args;
		this._chunkVars = {};
		this._currentCont = contFunction;
	}

	get args() { return this._args; }

	get chunkVars() { return this._chunkVars; }

	set currentCont(aFunction) {
		this._currentCont = aFunction;
	}

	continueProcess(proc) {
		this._currentCont.call(this._chunk, proc, this);
	}
}

class GreenGeneralFrame extends GreenAbstractFrame {
	constructor(chunk, args, contFunction) {
		super(chunk, args, contFunction);
		this._sequenceFrame = null;
	}

	get sequenceFrame() { return this._sequenceFrame; }
	set sequenceFrame(aFrame) { this._sequenceFrame = aFrame };

	get common() { return this.sequenceFrame.common; }
}

class GreenSequenceFrame extends GreenAbstractFrame {
	constructor(chunk, args, contFunction) {
		super(chunk, args, contFunction);
		this._common = {};
	}

	get common() { return this._common; }
	set common(aKeyedCol) { this._common = aKeyedCol; }
}

class GreenAbstractChunk {
	constructor(f) {
		this._funct = f;
	}

	newFrame(args) {
		return new GreenGeneralFrame(this, args, this.contStart);
	}

	get className() {
		return this.constructor.name;
	}

	get doFunction() {
		return this._funct;
	}

	/*
	 * Each continuation must do the following:
	 *   - Perform whatever small operations move the process forward.
	 *   - Push or pop frames on the process appropriate to be the immediate next operation.
	 *   - Set currentCont appropriately to when the frame is again active.
	 */
	contStart(proc, frame) {
		throw new Error("Implement contStart on "+this.className+".");
	}
}

class GreenFunctionChunk extends GreenAbstractChunk {
	constructor(f) {
		super(f);
	}

	contStart(proc, frame) {
		try {
			proc.retValue = this.doFunction(proc);
			proc.pop();
		} catch(err) {
			proc.processError(err);
			proc.activeStatus("dead by error");
		}
	}
}

class GreenRepeatWithObjectOnKeysAndValuesChunk extends GreenAbstractChunk {
	constructor(f) {
		super(f);
	}

	contStart(proc, frame) {
		let frameVars = frame.chunkVars;
		frameVars.index = 0;
		frameVars.keys = Object.keys(proc.retValue);
		frameVars.values = Object.values(proc.retValue);
		if (frameVars.keys.length === 0) {
			frame.currentCont = this.contFinish;
		} else {
			frame.currentCont = this.contIterate;
		}
	}

	contIterate(proc, frame) {
		try {
			let frameVars = frame.chunkVars;
			let idx = frameVars.index;
			proc.retValue = this.doFunction(proc, frameVars.keys[idx], frameVars.values[idx]);
			frameVars.index++;
			if (frameVars.index >= frameVars.keys.length) {
				frame.currentCont = this.contFinish;
			}
		} catch(err) {
			proc.processError(err);
			proc.activeStatus = "dead by error";
		}
	}

	contFinish(proc, frame) {
		proc.retValue = frame.chunkVars.keys.length;
		proc.pop();
	}
}

class GreenRepeatWithFromToByChunk extends GreenAbstractChunk {
	constructor(f) {
		super(f);
	}

	contStart(proc, frame) {
		let frameVars = frame.chunkVars;
		frameVars.index = proc.retValue.from;
		frameVars.lastIndex = proc.retValue.to;
		if (typeof proc.retValue.by !== 'undefined') {
			frameVars.interval = proc.retValue.by;
		} else {
			frameVars.interval = 1;
		}
		if (frameVars.index > frameVars.lastIndex) {
			frame.currentCont = this.contFinish;
		} else {
			frame.currentCont = this.contIterate;
		}
	}

	contIterate(proc, frame) {
		try {
			let frameVars = frame.chunkVars;
			let idx = frameVars.index;
			proc.retValue = this.doFunction(proc, idx);
			frameVars.index += frameVars.interval;
			if (frameVars.index > frameVars.lastIndex) {
				frame.currentCont = this.contFinish;
			}
		} catch(err) {
			proc.processError(err);
			proc.activeStatus = "dead by error";
		}
	}

	contFinish(proc, frame) {
		proc.retValue = frame.chunkVars.index;
		proc.pop();
	}
}

class GreenSendMessageWithObjSelArgsChunk extends GreenAbstractChunk {
	constructor(f) {
		super(f);
	}

	contStart(proc, frame) {
		let frameVars = frame.chunkVars;
		frameVars.receiver = proc.retValue.obj;
		frameVars.selector = proc.retValue.sel;
		frameVars.args = proc.retValue.args;
		// proc.push(seq.newFrame({}));
		frame.currentCont = this.contFinish;
	}

	contFinish(proc, frame) {
		proc.retValue = frame.chunkVars.index;
		proc.pop();
	}
}

class GreenChunkSequence extends GreenAbstractChunk {
	constructor() {
		super(null);
		this._initFunction = {};
		this._errorCallback = function(proc, err) { console.log(err); };
		this._chunkSequence = [];
		this._complete = false;
	}

	init(f) { this._initFunction = f; return this; }

	onError(f) { this._errorCallback = f; return this; }

	then(f) { this._chunkSequence.push(new GreenFunctionChunk(f)); return this; }

	repeatWithFromToBy(f) {
		this._chunkSequence.push(new GreenRepeatWithFromToByChunk(f));
		return this;
	}

	repeatWithObjectOnKeysAndValues(f) {
		this._chunkSequence.push(new GreenRepeatWithObjectOnKeysAndValuesChunk(f));
		return this;
	}

	sendMessageWithObjSelArgs(f) {
		this._chunkSequence.push(new GreenSendMessageWithObjSelArgsChunk(f));
		return this;
	}

	end() { this._complete = true; return this; }

	newFrame(args) {
		return new GreenSequenceFrame(this, args, this.contStart);
	}

	contStart(proc, frame) {
		let common = {};
		this._initFunction(common);
		frame.common = Object.assign(common, frame.args);
		frame.chunkVars.chunkIndex = 0;
		proc.pushErrorHandler(this._errorCallback);
		frame.currentCont = this.contStepSequence;
	}

	contStepSequence(proc, frame) {
		let idx = frame.chunkVars.chunkIndex;
		if (idx >= this._chunkSequence.length) {
			frame.currentCont = this.contFinish;
		} else {
			let newFrame = this._chunkSequence[idx].newFrame({});
			newFrame.sequenceFrame = frame;
			proc.push(newFrame);
			frame.chunkVars.chunkIndex++;
		}
	}

	contFinish(proc, frame) {
		proc.popErrorHandler();
		proc.pop();
	}
}

//-----------------------------------------------
exports.GreenProcess = GreenProcess;
exports.GreenChunkSequence = GreenChunkSequence;

