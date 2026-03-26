# useRef

`useRef` is a React Hook that lets you reference a value that's not needed for rendering

```js
const ref = useRef(initialRef);
```

## Usuage

- Referencing a value with a ref
- Manipulating the DOM with a ref
- Avoiding recreating the ref contents

---

## Reference

Call `useRef` at the top level of you component to declare a `ref`

```jsx
import { useRef } from "react";

function MyComponent() {
  const intervalRef = useRef(0);
  const inputRef = useRef(null);
  // ...
}
```

### By using a ref, you ensure that:

- You can store information between re-renders (unlike regular variables, which reset on every render).
- Changing it does not trigger a re-render (unlike state variables, which trigger a re-render).
- The information is local to each copy of your component (unlike the variables outside, which are shared)

---

## Examples of referencing a value with useRef

### Click Counter

This component uses a ref to keep track of how many times the button was clicked. Note that it's okay to use a ref instead of state here because the click count is only read and written in an event handler.

```jsx
import { useRef } from "react";

export default function Counter() {
  let ref = useRef(0);

  function handleClick() {
    ref.current = ref.current + 1;
    alert("you clicked" + ref.current + "times");
  }

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Stopwatch

This example uses a combination of state and refs. Both `startTime` and `now` are state variables because they are used for rendering. But we also need to hold an `interval ID` so that we can stop the interval on button press. Since the interval ID is not used for rendering, it's appropriate to keep in a ref, and manually update it.

```jsx
import { useRef, useState } from "react";

export default function Stopwatch() {
  const [startTime, setStartTime] = useState(null);
  const [now, setNow] = useState(null);
  const intervalRef = useRef(null);

  function handleState() {
    setStartTime(Date.now());
    setNow(Date.now());

    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setNow(Date.now());
    }, 10);
  }

  function handleStop() {
    clearInterval(intervalRef.current);
  }

  let secondPassed = 0;
  if (startTime != null && now != null) {
    secondPassed = (now - startTime) / 1000;
  }

  return (
    <>
      <h1>Time passed: {secondPassed.toFixed(3)}</h1>
      <button onClick={handleStart}>Start</button>
      <button onClick={handleStop}>Stop</button>
    </>
  );
}
```

---

## Caution Pitfall

Do not write or read ref.current during rendering
React expects that the body of your component behaves like a pure function

- If the inputs (props, state, and context) are the same, it should return exactly the same
- Calling it in a different order or with different arguments should not affect the results of other calls

Reading or writing a ref during rendering breaks these expectations

```jsx
function MyComponent() {
  // ...
  // 🚩 Don't write a ref during rendering
  myRef.current = 123;
  // ...
  // 🚩 Don't read a ref during rendering
  return <h1>{myOtherRef.current}</h1>;
}
```

You can read or write refs from event handlers or effect instead

```jsx
function MyComponent() {
  // ...
  useEffect(() => {
    // ✅ You can read or write refs in effects
    myRef.current = 123;
  });
  // ...
  function handleClick() {
    // ✅ You can read or write refs in event handlers
    doSomething(myOtherRef.current);
  }
  // ...
}
```

## Manipulating the DOM with a ref

It's particularly common to use a ref to manipulate the DOM. React has built-in support for this

```jsx
import { useRef } from "react";

function MyComponent() {
  const inputRef = useRef(null);
  // ..
}
```

Then pass your ref object as the `ref` attribute to the JSX of the DOM node you want to manipulate

```jsx
return <input ref={inputRef} />;
```

After React create the DOM node and puts it on the screen, React will set the `current property` of your ref object to that DOM node. Now you can access the `input` DOM node and call method like `focus()`

```jsx
function handleClick() {
  inputRef.current.focus();
}
```

React will set the `current` property back to `null` when the node is removed from the screen.

### Examples

### Focusing a text input

```jsx
import { useRef } from "react";

export default function Form() {
  const inputRef = useRef(null);

  function handleClick() {
    inputRef.current.focus();
  }

  return (
    <>
      <input ref={inputRef} />
      <button onClick={handleClick}>Focus the input</button>
    </>
  );
}
```

### Scrolling an image into view

In this example, clicking the button will scroll an image into view. It uses a ref to the list DOM node, and then calls DOM `querySelectorAll` API to find the image we want to scroll to.

```jsx
import { useRef } from "react";

export default function CatFriends() {
  const listRef = useRef(null);

  function scrollToIndex(index) {
    const listNode = listRef.current;
    // This line assumes a particular DOM structure:
    const imgNode = listNode.querySelectorAll("li > img")[index];
    imgNode.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  return (
    <>
      <nav>
        <button onClick={() => scrollToIndex(0)}>Neo</button>
        <button onClick={() => scrollToIndex(1)}>Millie</button>
        <button onClick={() => scrollToIndex(2)}>Bella</button>
      </nav>
      <div>
        <ul ref={listRef}>
          <li>
            <img src="https://placecats.com/neo/300/200" alt="Neo" />
          </li>
          <li>
            <img src="https://placecats.com/millie/200/200" alt="Millie" />
          </li>
          <li>
            <img src="https://placecats.com/bella/199/200" alt="Bella" />
          </li>
        </ul>
      </div>
    </>
  );
}
```

### Playing and Pausing a video

This example uses a ref to call `play()` and `pause()` on a video DOM node

```jsx
import { useState, useRef } from "react";

export default function VideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const ref = useRef(null);

  function handleClick() {
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);

    if (nextIsPlaying) {
      ref.current.play();
    } else {
      ref.current.pause();
    }
  }

  return (
    <>
      <button onClick={handleClick}>{isPlaying ? "Pause" : "Play"}</button>
      <video
        width="250"
        ref={ref}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      >
        <source
          src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
          type="video/mp4"
        />
      </video>
    </>
  );
}
```

---

### Real World Example

```jsx
const isFetching = useRef(false)

async function fetchData() {
    if(isFetching.current) return 

    isFetching.current = true 
    await fetch('/api/data')
    isFetching.current = false
}
```

Debounce with useRef

```jsx
function useDebounce(callback,delay) {
    const timeoutRef = useRef()

    return (...args) => {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
            callback(...args)
        },delay)
    }
}
```

- Keeps the same timeout ID across renders 
- No re-render needed


Throttle Example

```jsx
function useThrottle(callback,delay) {
    const lastCall = useRef(0)

    return (...args) {
        const now = Date.now()

        if(now - lastCall.current >= delay) {
            lastCall.current = now 
            callback(...args)
        }
    }
}
```