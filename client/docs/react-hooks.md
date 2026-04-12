# React Hooks

## 1. `useRef` - Avoid Re-renders for Mutable

Store values without triggering re-renders

```jsx
const ref = useRef(0);

ref.current += 1; // X
```

When it improves performance

- Storing previous values
- Tracking DOM elements
- Holding mutable state that doesn't affect UI

It faster, because react does not re-render when `ref.current` changes.

---

## `React.memo` - Skip Re-rendering Component

Idea: Prevent component re-render if props didn't change

```jsx
const MyComp = React.memo(({ value }) => {
  console.log("rendered");
  return <div>{value}</div>;
});
```

Use Case

- Large Lists
- Expensive components
- Pure UI Components

---

## 3. `useCallback` - Memoize Functions

Functions are recreated on every render

```jsx
const handleClick = () => {};
```

Solution

```jsx
const handleClick = useCallback(() => {
  console.log("Clicked");
}, []);
```

When it improves performance

- When passing functions to memoized children

---

## 4. `useMemo` - Memoize Expensive Calculations

Avoid recalculating heavy logic

```jsx
const result = useMemo(() => {
  return expensiveFunction(data);
}, [data]);
```

Use Case:

- Filtering large arrays
- Sorting
- Heavy computations

---

## 5. `React.lazy` - Code Splitting

Load components only when needed

```jsx
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));
```

Why it improves performance

- Reduces initial bundle size
- Faster page load

---

## 6. `Suspense` - Handle Lazy Loading Gracefully

Works with `lazy`

```jsx
<Suspense fallback={<div>Loading</div>}>
    <HeavyComponent>
</Suspense>
```

Benefit

- Better UX while loading
- Enables streaming + concurrent features

---

## 7. Example

```jsx
const ListItem = React.memo(({ item, onClick }) => {
  return <div onClick={onClick}>{item.name}</div>;
});

function List({ items }) {
  const handleClick = useCallback((item) => {
    console.log(item);
  }, []);

  const filtered = useMemo(() => {
    return items.filter((i) => i.active);
  }, [items]);

  return filtered.map((item) => (
    <ListItem key={item.id} item={item} onClick={() => handleClick(item)} />
  ));
}
```
