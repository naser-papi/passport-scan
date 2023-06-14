import { useState } from "react";
import { createWorker } from "tesseract.js";
import "./App.css";
//allSettle
interface IPassInfo {
  passportNo: string;
  name: string;
  surname: string;
  country: string;
  sex: string;
  issueDate: string;
  expireDate: string;
  FatherName: string;
  birthDate: string;
}
function App() {
  const [imagePath, setImagePath] = useState<string>(null);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [info, setInfo] = useState<IPassInfo>(null);
  const [selectedFile, setSelectedFile] = useState<File>(null);

  const handleChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setImagePath(URL.createObjectURL(event.target.files[0]));
  };

  const scanWithTesseract = async () => {
    setPending(true);
    const worker = await createWorker({
      logger: (m) => console.log(m), // Add logger here
    });

    await (async () => {
      await worker.loadLanguage("eng");
      await worker.initialize("eng");
      const {
        data: { text },
      } = await worker.recognize(imagePath);
      setText(text);
      await worker.terminate();
      setPending(false);
    })();
  };

  const scanWithMindee = () => {
    setPending(true);
    let data = new FormData();
    data.append("document", selectedFile, selectedFile.name);

    let xhr = new XMLHttpRequest();

    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        const result = JSON.parse(this.responseText) as any;
        if (result.api_request?.status === "success") {
          const passData = result.document.inference.pages[0].prediction;
          setInfo({
            name: passData.given_names[0].value,
            surname: passData.surname.value,
            birthDate: passData.birth_date.value,
            country: passData.country.value,
            passportNo: passData.id_number.value,
            sex: passData.gender.value,
            expireDate: passData.expiry_date.value,
            FatherName: passData.father_name?.value,
            issueDate: passData.issuance_date.value,
          });
        }
        setPending(false);
      }
    });

    xhr.open(
      "POST",
      "https://api.mindee.net/v1/products/mindee/passport/v1/predict"
    );
    xhr.setRequestHeader(
      "Authorization",
      "Token 234353c2886d073ea0eef2ae50d14cd3"
    );
    xhr.send(data);
  };

  return (
    <main className="app-main">
      <aside>
        <h3>select your passport image file</h3>
        {imagePath ? (
          <img src={imagePath} className="app-image" alt="logo" />
        ) : (
          <input type="file" onChange={handleChange} />
        )}
        <div className={"actions"}>
          <button
            disabled={pending}
            onClick={scanWithMindee}
            style={{ height: 50 }}
          >
            scan with Mindee API
          </button>
          <button
            disabled={pending}
            onClick={scanWithTesseract}
            style={{ height: 50 }}
          >
            scan with Tessercat
          </button>
        </div>
      </aside>
      <aside>
        <h3>Extracted data</h3>
        {text && <p>{text}</p>}
        {info ? (
          <section className={"info-box"}>
            <label>
              <span>PassNo:</span>
              <strong>{info.passportNo}</strong>
            </label>
            <label>
              <span>Name:</span>
              <strong>{info.name}</strong>
            </label>
            <label>
              <span>Surname:</span>
              <strong>{info.surname}</strong>
            </label>
            <label>
              <span>birth date:</span>
              <strong>{info.birthDate}</strong>
            </label>
            <label>
              <span>Gender:</span>
              <strong>{info.sex}</strong>
            </label>
            <label>
              <span>Issue Date:</span>
              <strong>{info.issueDate}</strong>
            </label>
            <label>
              <span>Expired Date:</span>
              <strong>{info.expireDate}</strong>
            </label>
          </section>
        ) : pending ? (
          <p>wait for convert...</p>
        ) : (
          <></>
        )}
      </aside>
    </main>
  );
}

export default App;
