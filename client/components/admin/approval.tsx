
interface ApprovalPromptProps {
    part: {
        arguments: string
        name: string
    }
    onApprove: () => void
    onDeny: () => void
}

export function ApprovalPrompt({ part, onApprove, onDeny }: ApprovalPromptProps) {
    const args = JSON.parse(part.arguments);
  
    return (
      <div className="border border-yellow-500 rounded-lg p-4 bg-yellow-50">
        <div className="font-semibold mb-2">
          🔒 Approval Required: {part.name}
        </div>
        <div className="text-sm text-gray-600 mb-4">
          <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(args, null, 2)}
          </pre>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            ✓ Approve
          </button>
          <button
            onClick={onDeny}
            className="px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            ✗ Deny
          </button>
        </div>
      </div>
    );
  }