import Person from './person';
import { memo } from 'react';
const List = ({ people, removeUser }: { removeUser: (id:number) => void,people: { name: string, id: number }[] }) => {
  return (
    <div>
      {people.map((person) => {
        return <Person removeUser={removeUser} key={person.id} {...person} />;
      })}
    </div>
  );
};
export default memo(List);
// export default List