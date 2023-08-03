

## June 20 2023

Unlike python, javascript does not have keyword args. 
That makes the design of the libraries I'm using a little cumbersome to use. 

I either have to do 
```js
new Block(Nesting.POST, ['all'], {}, function (text, opts) {

})
```
which is more js like, but then I cannot have good defaults (as you 
have to specify all positional arguments before the function), or I have to do 
```
new Block(function (text, opts) {
  
}, Nesting.POST, ['all'], {})
```

In python I could be more clever and seperate the two kinds of data with 
function syntax. This looks much cleaner.
```python
@block(Nesting.POST, ['all'], "lskdjfc:")
def BlockName(text: str, opts: Mapping[str, str]):
  ...
```


The closest I could get in JS is to wrap a class: 
```ts
@block(Nesting.POST, ['all'], {l: 1, s: true, ...})
class BlockName {
  parse(text: str, opts: BlockOptions): Tag {
    // do something
  }
}
```
Ok I guess there is one more option
```
block()(function (text, opts) {

})
```
While this is not very js like it does have the benefit of letting you overload 
things where you want to overload them.
I'm probably overthinking this as no one is going to use this library but me anyway

The correct thing in JS would be 

new Block({
  name: 
})

But this is incorrect! `BlockName` should be an *instance* of `Block`, 
not a subclass of block. :( I could hack an instance of Block in 
place of that class. That's about the best I can hope for, I think. 

The main reason this works in python is that a `Callable` class is 
conflatable with a method (it's just a function with some parameters). 
In Javascript it isn't as easy to make this change. 

If I chose to implement Blocks and Inlines as functions with extra 
parameters (in other words have element extend function) this is called a 
Hybrid Type and is deprecated in Typescript. It's also cumbersome to set up 
because it requires writing and interface, function, and class to get typechecked, 
at which point the class syntax above starts to look preferable. 
It would also require everyone consuming the library in Typescript to also 
do the same set up. 

Probably the best solution is to rethink and write block as a series of 
behaviors... so: 

abstract class Block < Element 
  abstract parse(text: str, opts: BlockOptions={}): Tag
  abstract get nest(): Nesting
  abstract get sub(): SubElement
  abstract get opts(): BlockOptions

But this is stupid. The other option is to forgo the class bs and 
"just use maps" clojure style. This may be the way to go. 

In that case 
const SomeBlock = terminal_block()(function (...) {

})

Still not the best syntax and makes it hard to check whether something is a Block or not. 



