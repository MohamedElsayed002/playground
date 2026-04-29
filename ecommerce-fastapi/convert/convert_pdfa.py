import subprocess
import tempfile

def convert_to_pdfa(input_bytes: bytes) -> bytes:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
        f.write(input_bytes)
        input_path = f.name

    output_path = input_path.replace(".pdf", "_pdfa.pdf")

    subprocess.run([
        "gs",
        "-dPDFA=2",
        "-dBATCH",
        "-dNOPAUSE",
        "-sDEVICE=pdfwrite",
        f"-sOutputFile={output_path}",
        input_path
    ])

    with open(output_path, "rb") as f:
        return f.read()