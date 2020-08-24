# NodeGreenProcess

This is a different approach to managing the proliferation of callback processes in Node.js.  A *GreenProcess* is a [green thread](https://en.wikipedia.org/wiki/Green_threads) where each contextual frame of the process is handled openly.  This is a reaction to my experimentations with Node.js parallelism. (See [NodeParallelismExperiments.md](https://gist.github.com/jonkanderson/c0e7f78c559ffa176f0b787b1a98e3d5).)

The core of the system is the single file called *GreenProcess.js*.

## Prerequisites

This requires Node.js, of course.  This code was developed on Debian Linux using generic tools.

## Tests

Run tests by evaluating "`make test`" in the *tests* directory.  The expected output is found in the *regressionData* directory.

## Using GreenProcess

View *tests/test01.js* for some examples.  Consider the following as you read the code: The important concept is that one constructs a *GreenChunkSequence* which is a sequence of functions to control the process rather directly. Information common to the sequence is accessed via *proc.common*.  One can run a sequence by (1) instantiating a *GreenProcess*, (2) pushing a frame for the sequence onto the process, and then (3) telling the process to *resume()*.  A frame is instantiated by calling *newFrame()* with a set of arguments which will be included (or replace) values on *proc.common* after *init()* is called.  A callback for the return value can be set on the process by using *withRetValueDo()*. 

## Future

As of this writing, the only repetition frame in the process is a `for` loop with static limits on its range.  I intend to implement other repetition frames.  Also required is a natural and dynamic means for lookup and calling other sequences.  Without these the system is not very useful.

## Bugs

- (*Possible concern*) The test *test01.js* works in nodejs, firefox, and chromium, but firefox keeps more context when I look at the stack of the intended fail on the "Y__" thread.  This may indicate a memory leak.

Jon Anderson (jonkanderson@gmail.com)
