# NodeGreenProcess

This is a different approach to managing the proliferation of callback processes in Node.js.  A *GreenProcess* is a [green thread](https://en.wikipedia.org/wiki/Green_threads) where each contextual frame of the process is handled fairly directly.  This is a reaction to my experimentations with Node.js parallelism. (See [NodeParallelismExperiments.md](https://gist.github.com/jonkanderson/c0e7f78c559ffa176f0b787b1a98e3d5).)

The core of the system is the single file called *GreenProcess.js*.

## Prerequisites

This requires Node.js, of course.  This code was developed on Debian Linux using generic tools.

## Tests

Run tests by evaluating "`make test`" in the *tests* directory.  The expected output is found in the *regressionData* directory.  One can also run tests in a browser by opening the *tests/browser_test0&ast;.html* files.

## Using GreenProcess

View *tests/test0&ast;.js* for some examples.  As you read code. consider the following: The important concept is that one constructs a *GreenChunkSequence* which is a sequence of functions (called *chunks*) to control the process rather directly. Information common to the sequence is accessed via *proc.common*.  One can run a sequence by (1) instantiating a *GreenProcess*, (2) pushing a frame for the sequence onto the process, and then (3) telling the process to *resume()*.  A frame is instantiated by calling *newFrame()* with a set of arguments which will be included in *proc.common* after *init()* is called.  The return value of a chunk is kept in *proc.retValue*.  When a green thread is complete, a callback for the return value can be called which is set on the process by using *withRetValueDo()*.

Also, note that there are a number of *repeat&ast;* methods for constructing a sequence. The parameters for a *repeat&ast;* chunk is given using the return value of the prior chunk.  This pattern is valuable in order to make the system more responsive.  It allows a green process to yield to other green processes and potentially execute their chunks in between iterations. 

## Future

A natural and dynamic means for lookup and calling other sequences would be an important addition.

## Bugs

- (*Possible concern*) The test *test01.js* works in nodejs, firefox, and chromium, but firefox keeps more context when I look at the stack of the intended fail on the "Y__" thread.  This may indicate a memory leak.

Jon Anderson (jonkanderson@gmail.com)
