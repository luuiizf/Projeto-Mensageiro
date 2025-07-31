import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable } from "rxjs"
import { map } from "rxjs/operators"

export interface FileInfo {
  file_id: string
  filename: string
  size: number
  upload_date: string
  file_url: string
}

export interface UploadResponse {
  success: boolean
  file_id: string
  message: string
  file_url: string
}

@Injectable({
  providedIn: "root",
})
export class FileService {
  private soapUrl = "http://localhost:8001/soap"

  constructor(private http: HttpClient) {}

  uploadFile(file: File, roomName: string): Observable<UploadResponse> {
    return new Observable((observer) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64Data = (reader.result as string).split(",")[1]

        const soapEnvelope = `
          <?xml version="1.0" encoding="utf-8"?>
          <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
            <soap:Body>
              <upload_file>
                <filename>${file.name}</filename>
                <file_data>${base64Data}</file_data>
                <room_name>${roomName}</room_name>
                <username>guest</username>
                <description>Uploaded via SOAP</description>
              </upload_file>
            </soap:Body>
          </soap:Envelope>
        `

        this.http
          .post(this.soapUrl, soapEnvelope, {
            headers: {
              "Content-Type": "text/xml; charset=utf-8",
              SOAPAction: "upload_file",
            },
            responseType: "text",
          })
          .subscribe({
            next: (response) => {
              const parser = new DOMParser()
              const xmlDoc = parser.parseFromString(response, "text/xml")

              const success = xmlDoc.getElementsByTagName("success")[0]?.textContent === "true"
              const fileId = xmlDoc.getElementsByTagName("file_id")[0]?.textContent || ""
              const message = xmlDoc.getElementsByTagName("message")[0]?.textContent || ""
              const fileUrl = xmlDoc.getElementsByTagName("file_url")[0]?.textContent || ""

              observer.next({
                success,
                file_id: fileId,
                message,
                file_url: fileUrl,
              })
              observer.complete()
            },
            error: (error) => {
              observer.error(error)
            },
          })
      }
      reader.readAsDataURL(file)
    })
  }

  downloadFile(fileId: string): Observable<Blob> {
    const soapEnvelope = `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                     xmlns:tns="http://localhost:8001/soap">
        <soap:Body>
          <tns:download_file>
            <tns:file_id>${fileId}</tns:file_id>
          </tns:download_file>
        </soap:Body>
      </soap:Envelope>
    `

    return this.http
      .post(this.soapUrl, soapEnvelope, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "download_file",
        },
        responseType: "text",
      })
      .pipe(
        map((response) => {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(response, "text/xml")
          const base64Data = xmlDoc.getElementsByTagName("download_fileResult")[0]?.textContent || ""

          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          return new Blob([bytes])
        }),
      )
  }

  listFiles(): Observable<FileInfo[]> {
    const soapEnvelope = `
      <?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                     xmlns:tns="http://localhost:8001/soap">
        <soap:Body>
          <tns:list_files />
        </soap:Body>
      </soap:Envelope>
    `

    return this.http
      .post(this.soapUrl, soapEnvelope, {
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "list_files",
        },
        responseType: "text",
      })
      .pipe(
        map((response) => {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(response, "text/xml")
          const fileElements = xmlDoc.getElementsByTagName("FileInfo")

          const files: FileInfo[] = []
          for (let i = 0; i < fileElements.length; i++) {
            const fileElement = fileElements[i]
            files.push({
              file_id: fileElement.getElementsByTagName("file_id")[0]?.textContent || "",
              filename: fileElement.getElementsByTagName("filename")[0]?.textContent || "",
              size: Number.parseInt(fileElement.getElementsByTagName("size")[0]?.textContent || "0"),
              upload_date: fileElement.getElementsByTagName("upload_date")[0]?.textContent || "",
              file_url: fileElement.getElementsByTagName("file_url")[0]?.textContent || "",
            })
          }

          return files
        }),
      )
  }
}
