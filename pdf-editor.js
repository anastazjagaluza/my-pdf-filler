import { html, LitElement, css } from "lit-element";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import 'regenerator-runtime/runtime'
import  SignatureImg from "./img/signature.png";
import "./pdf-editor.css";

export class PdfEditor extends LitElement{

    static get properties(){
        return {
            loaded: {
                type: Boolean
            }
        }
    }

    constructor(){
        super();
        this.loaded = false;
    }
    static get styles(){
        return css `
                :host{
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background-color: #222222;
            width: 100%;
            height: 100%;
        }

        #pdf,#dropzone {
        border: 1px solid #444444;
        }

        #dropzone {
            width: 60vw;
            height: 30vh;
            background: #3B3B3B;
            color: white;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif
        }

        input {
            width: 11rem;
        }

        input[type=file]::-webkit-file-upload-button {
            visibility: hidden;
            outline: 0;
            text-align: center;
        }
        input[type=file]::before {
            content: 'Upload a pdf';
            color: #444444;
            display: inline-block;
            background: lightgreen;
            border-radius: 3px;
            padding: 5px 8px;
            outline: none;
            white-space: nowrap;
            -webkit-user-select: none;
            cursor: pointer;
            font-weight: 700;
            font-size: 20pt
        }
        input[type=file] {
        color: transparent;
        }
        #input::active {
        outline: 0;
        }
        #input:focus{
            outline: 0;
        }`
    }

   async editPdf(file){
        // Today's date
         
        let today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();

        today = `${dd}/${mm}/${yyyy}`;

        const fileAsBlob = new Blob([file]);
        const existingPdfBytes = await fileAsBlob.arrayBuffer();
        
        
        
        // PDF Modification
        const pdfDoc = await PDFDocument.load(existingPdfBytes)
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const pages = pdfDoc.getPages()
        const correctPage = pages[pages.length-1]
        const { width, height } = correctPage.getSize()
        
        // Image of the signature
        
       //   const imgBlob = new Blob([SignatureImg]);
       
        const pngImageBytes = await fetch(SignatureImg).then((res) => res.arrayBuffer())
        const signature = await pdfDoc.embedPng(pngImageBytes)
        
        const pngDims = signature.scale(0.03)
        const data = [
            {
                text: "x",
                x: 100,
                y: height/2+150
            },
            {
                text: "Anastazja Galuza",
                x: 110,
                y: height / 2 - 24
            },
            {
                text: "01.07.1992",
                x: width /2 + 50,
                y: height / 2 - 24
            },
            {
                text: '71358986',
                x: 150,
                y: height / 2 - 54
            },
            {
                text: "anastazjagaluza@gmail.com",
                x: 110,
                y: height / 2 - 84
            },
            {
                text: "2",
                x: 150,
                y: height / 2 - 114
            },
            {
                text: "Mikkel Munk",
                x: width / 2,
                y: height / 2 - 144 
            },
            {
                text: "mikkmunk@outlook.dk",
                x: 110,
                y: height / 2 - 170
            },
            {
                text: '19.12.1992',
                x: width/2 - 50,
                y: height / 2 - 200
            },
            {
                text: "0",
                x: width / 2 + 10,
                y: 176
            }
        ];

        for(const elem of data){
            correctPage.drawText(elem.text, {
                x: elem.x,
                y: elem.y,
                size: 12,
                font: helveticaFont,
                color: rgb(0, 0, 0),
        })
        }
        // Date
        correctPage.drawText(`${today}`, {
            x: 100,
            y: 117,
            size: 12,
            font: helveticaFont,
            color: rgb(0, 0, 0),
    })

        // Add signature
        correctPage.drawImage(signature, {
            x: 280,
            y: 107,
            width: pngDims.width,
            height: pngDims.height
    })
        const newDoc = await PDFDocument.create();
        const [myPage] = await newDoc.copyPages(pdfDoc, [pages.length-1]);
        newDoc.addPage(myPage);
        this.loaded = true;
        this.requestUpdate();
        const pdfDataUri = await newDoc.saveAsBase64({ dataUri: true });
        this.shadowRoot.querySelector('#pdf').src = pdfDataUri;
        this.requestUpdate();
    }

    dragging(e){
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    }

    show(e) {
        e.preventDefault();
        const file = e.dataTransfer.items[0].getAsFile();     
        this.editPdf(file);
        
    }

    loadPdf(e){
        e.preventDefault();
        const file = (e.target).files[0];
        this.editPdf(file);
    }

    render(){
        return html`
        <input @input="${this.loadPdf}" id="input" type="file">
        ${this.loaded != false 
        ? html `<iframe id="pdf" style="width: 90%; height: 60%;"></iframe>`
        : html `<div id="dropzone" @dragover="${this.dragging}" @drop="${this.show}" id="dropzone">or drag a file here</div>`}
        `
    }
}
customElements.define("pdf-editor", PdfEditor);