
import Person from "./person";

export default function List({ people }: { people: { name: string, id: number }[] }) {
    return (
        <div>
            {people.map((item) => {
                return <Person key={item.id} name={item.name} />
            })}
        </div>
    )
}