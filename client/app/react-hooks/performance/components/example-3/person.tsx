import { Button } from "@/components/ui/button";

const Person = ({
  name,
  id,
  removeUser,
}: {
  name: string;
  id: number;
  removeUser: (id: number) => void;
}) => {
  return (
    <div>
      <h4>{name}</h4>
      <Button onClick={() => removeUser(id)}>Remove</Button>
    </div>
  );
};
export default Person;
