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

        const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><upload_file><filename>${file.name}</filename><file_data>${base64Data}</file_data><room_name>${roomName}</room_name><username>guest</username><description>Uploaded via SOAP</description></upload_file></soap:Body></soap:Envelope>`

        console.log('DEBUG Angular: Enviando SOAP envelope:', soapEnvelope.substring(0, 200) + '...')
        console.log('DEBUG Angular: URL:', this.soapUrl)

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
              console.error('DEBUG Angular: Erro no upload SOAP:', error)
              console.error('DEBUG Angular: Status:', error.status)
              console.error('DEBUG Angular: StatusText:', error.statusText)
              console.error('DEBUG Angular: Error object:', JSON.stringify(error, null, 2))
              observer.error(error)
            },
          })
      }
      reader.readAsDataURL(file)
    })
  }

  downloadFile(fileId: string): Observable<{success: boolean, filename: string, blob: Blob}> {
    console.log('DEBUG Angular: Iniciando download do arquivo:', fileId)

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <download_file>
      <file_id>${fileId}</file_id>
    </download_file>
  </soap:Body>
</soap:Envelope>`

    console.log('DEBUG Angular: Enviando SOAP envelope para download:', soapEnvelope)

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
          console.log('DEBUG Angular: Resposta do download recebida:', response)

          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(response, "text/xml")

          const success = xmlDoc.getElementsByTagName("success")[0]?.textContent === "true"
          const filename = xmlDoc.getElementsByTagName("filename")[0]?.textContent || ""
          const base64Data = xmlDoc.getElementsByTagName("file_data")[0]?.textContent || ""

          console.log('DEBUG Angular: Dados extraídos - success:', success, 'filename:', filename, 'base64 length:', base64Data.length)

          if (!success || !base64Data) {
            throw new Error('Falha no download do arquivo')
          }

          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }

          const blob = new Blob([bytes])
          console.log('DEBUG Angular: Blob criado, tamanho:', blob.size)

          return { success, filename, blob }
        }),
      )
  }

  listFiles(): Observable<FileInfo[]> {
    console.log('DEBUG Angular: Iniciando listagem de arquivos')

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <list_files>
      <room_name></room_name>
    </list_files>
  </soap:Body>
</soap:Envelope>`

    console.log('DEBUG Angular: Enviando SOAP envelope para listagem:', soapEnvelope)

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
          console.log('DEBUG Angular: Resposta da listagem recebida:', response)

          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(response, "text/xml")
          const fileElements = xmlDoc.getElementsByTagName("file")

          console.log('DEBUG Angular: Elementos de arquivo encontrados:', fileElements.length)

          const files: FileInfo[] = []
          for (let i = 0; i < fileElements.length; i++) {
            const fileElement = fileElements[i]
            const file = {
              file_id: fileElement.getElementsByTagName("file_id")[0]?.textContent || "",
              filename: fileElement.getElementsByTagName("filename")[0]?.textContent || "",
              size: Number.parseInt(fileElement.getElementsByTagName("file_size")[0]?.textContent || "0"),
              upload_date: fileElement.getElementsByTagName("upload_date")[0]?.textContent || "",
              file_url: "",
            }

            console.log('DEBUG Angular: Arquivo processado:', file)
            files.push(file)
          }

          console.log('DEBUG Angular: Total de arquivos processados:', files.length)
          return files
        }),
      )
  }
}
