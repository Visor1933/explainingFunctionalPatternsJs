const State = {
   "unPromiseArray": []
};
const Nothing = Symbol("Nothing");
const IO = Symbol("IO");

const Maybe = constructor => {
   let value;
   return _ => {
      if (value === undefined){
         value = constructor();
         if (value === null) value = Nothing;
      }
      return value;
   };
};
// this function unboxes all and any Array of Monads we define in this maner
const unboxArray = boxes => boxes.map(unbox => unbox());

console.group("Simple Maybe Example");
const maybeValue = Maybe(_ => "simple value");
const maybeNothing = Maybe(_ => null);
// to unbox the values we need to call them, since Monadic value is a function
// we could try to go all the way Haskell and define Just and Nothing also as Monads
// but in my opinion, JS's semantics aren't a good fit for this kind of solution.
// things will just get too complex with the same result.
// different implementation is totally fine, since Monad is a set of rulse a type follows
// if we can comfortably define and unbox them on a different technology in a different
// way, I think it is how it should be done.
// especially since Monads are widely used to deal with mutability inside of immutable code
// it's okay to use what mutable itstrumets you get in mutable language to simply isolate
// mutable code from immutable.
console.log(maybeValue());
console.log(maybeNothing());
console.groupEnd();

console.group("Advanced Maybe Example");
const maybeBoxes = [Maybe(_ => "value"), Maybe(_ => null)];
const processMaybes = maybeBoxes => {
   const values = unboxArray(maybeBoxes);
   console.log(values);

   const messages = values.map(v => v === Nothing
                                       && "Value could not be computed"
                                       || "computation success");
   messages.forEach(console.log);
   return IO;
};
let t1, t2, t3;
t0 = performance.now();
processMaybes(maybeBoxes);
t1 = performance.now();
processMaybes(maybeBoxes);
t2 = performance.now();
console.info(`first run of Unboxing elapsed in : ${t1-t0}`);
console.info(`second run of Unboxing elapsed in : ${t2-t1}`);
console.groupEnd();

// because Promise monad has it's own predefined syntax, and it isn't completely a monad.
// but we will avoid those cases, where it loses it's "MONADness", they are sic either way.
// so, with minor workarounds we can make it look the same way as the rest of the code
const AsyncMaybe = constructor => {
   let value;
   return async _ => {
      if (value === undefined){
         value = await constructor();
         if (value === null) value = Nothing;
      }
      return value;
   };
};
const unPromiseArray = async promises => { State.unPromiseArray = await Promise.all(promises); };
const lastUnPromisedArray = _ => State.unPromiseArray;
const asyncUnboxArray = async boxes => {
   await unPromiseArray(unboxArray(boxes));
   return lastUnPromisedArray();
};

// Prior to this point, where we have been dealing with consant hardcoded values,
// it was hard to reason about advantage of the Monad and why should we use it.
// There are two common cases to use it.

// There is a function, which can break or return incorrect results in some corner cases
console.group("True Maybe Example Functions");
const divide = a => b => a / b;
// this function can receive 0 as a second parameter and will return +/- Infinity
// this is a JS workaround, which we will turn to normal semantics back again with Maybe,
// otherwise we can encouner infamous JS problem, where division should not be computed,
// but still returns a number Infinity, which breaks everything.
console.log(`divide(1)(0) = ${divide(1)(0)}`);
// let's define division function which returns either Just number or
const maybeDivide = a => b => Maybe(_ => b === 0 ? null : divide(a)(b));
console.log(maybeDivide(1)(0)()); // last braces are needed to unbox.
console.groupEnd();

// Most commonly Maybe is used to process input, since we never know, what kind of input
// we will receive. After parsing is completed we return either parsed data or Nothing
(async _ => {
   console.group("True Maybe Example Input");
   const constructor = uri => async _ => fetch(uri).then(res => res.json()).catch(_ => null);

   // At this point values arent computed. they will be computed only once by access
   // this gives us the lazyness.
   const asyncMaybeBoxes = [
      AsyncMaybe(constructor("/data.json")),
      AsyncMaybe(constructor("/ddaattaa.json"))
   ];

   // Here we unbox Maybe Boxes and print corresponding message
   // since this function is IO we can return just return IO action to indicate that.
   // This is needed for lambda calculus, since every funciton takes one and only 1 value
   // and returns 1 and only 1 result.
   // This way, we can easily track errors, if we encounter undefined return somewhere,
   // it is then undefined ineed.
   const processMaybes = async asyncMaybeBoxes => {
      const values = await asyncUnboxArray(asyncMaybeBoxes);
      console.log(values);

      const messages = values.map(v => v === Nothing
                                          && "Value could not be computed"
                                          || "computation success");
      messages.forEach(console.log);
      return IO;
   };

   let t0, t1, t2;
   // On first call, all the values are computed since we IO them all.
   // The second value here throws a 404 Error into the console.
   t0 = performance.now();
   await processMaybes(asyncMaybeBoxes);

   // On second call, we simply get the same result for the same set of Maybe Boxes
   // it will be always this way, so that means we can consider the function is pure.
   // but noticable is that it doesn't throw an Error anymore, since those values are already
   // computed.
   t1 = performance.now();
   await processMaybes(asyncMaybeBoxes);

   t2 = performance.now();
   console.info(`first run of Unboxing elapsed in : ${t1-t0}`);
   console.info(`second run of Unboxing elapsed in : ${t2-t1}`);
   // Immagine that server created the file called "ddaattaa.json" in the meantime
   // since all our previous values are immutable, to see this, we need to create a new Maybe
   // box. This is kind of the same as in imperative paradigm, but ofcourse it is so.
   // Many of monads are mutable from the inside, as you can see here, this one needs
   // one LET to store the result after computation and the async one needs a second LET
   // to additionaly unbox Promise monad.
   // to cut long story short, if we want to request the data again, we need new Maybe value
   console.groupEnd();
})();