export default function RoomsPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
      <div className="text-5xl mb-4 select-none">💬</div>
      <h2 className="text-xl font-semibold text-gray-600 mb-1">Welcome to Chat</h2>
      <p className="text-sm max-w-xs">
        Pick a conversation from the sidebar, or create a new one with that{" "}
        <span className="font-mono bg-gray-100 px-1 rounded">+</span> button.
      </p>
    </div>
  );
}
