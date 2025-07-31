const soap = require("soap")
const fs = require("fs")
const path = require("path")
const readline = require("readline")

const SOAP_URL = "http://localhost:8001?wsdl"

class MensageiroSOAPClient {
  constructor() {
    this.client = null
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  async connect() {
    try {
      console.log("🔗 Conectando ao serviço SOAP...")
      this.client = await soap.createClientAsync(SOAP_URL)
      console.log("✅ Conectado com sucesso!")
      console.log("📋 Serviços disponíveis:", Object.keys(this.client.describe()))
      return true
    } catch (error) {
      console.error("❌ Erro ao conectar:", error.message)
      console.log("💡 Verifique se o servidor SOAP está rodando em http://localhost:8002")
      return false
    }
  }

  async uploadFile(username, roomName, filePath, description = "") {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error("Arquivo não encontrado")
      }

      const fileData = fs.readFileSync(filePath)
      const filename = path.basename(filePath)
      const fileDataBase64 = fileData.toString("base64")

      console.log(`📤 Enviando arquivo: ${filename}`)
      console.log(`👤 Usuário: ${username}`)
      console.log(`🏠 Sala: ${roomName}`)
      console.log(`📝 Descrição: ${description || "Sem descrição"}`)
      console.log(`📊 Tamanho: ${fileData.length} bytes`)

      const result = await this.client.upload_fileAsync({
        username: username,
        room_name: roomName,
        filename: filename,
        file_data: fileDataBase64,
        description: description,
      })

      if (result[0] && result[0].response && result[0].response.success) {
        console.log("✅ Upload realizado com sucesso!")
        const fileInfo = result[0].response.file_info
        if (fileInfo) {
          console.log("📄 Informações do arquivo:")
          console.log(`   ID: ${fileInfo.file_id}`)
          console.log(`   Nome: ${fileInfo.filename}`)
          console.log(`   Tamanho: ${fileInfo.file_size} bytes`)
          console.log(`   Data: ${fileInfo.upload_date}`)
          console.log(`   Usuário: ${fileInfo.uploader_username}`)
          console.log(`   Sala: ${fileInfo.room_name}`)
        }
        return fileInfo
      } else {
        const message = result[0]?.response?.message || "Erro desconhecido"
        console.error("❌ Erro no upload:", message)
        return null
      }
    } catch (error) {
      console.error("❌ Erro ao enviar arquivo:", error.message)
      return null
    }
  }

  async downloadFile(fileId, outputPath) {
    try {
      console.log(`📥 Baixando arquivo com ID: ${fileId}`)

      const result = await this.client.download_fileAsync({
        file_id: fileId,
      })

      if (result[0] && result[0].file_data) {
        const fileData = Buffer.from(result[0].file_data, "base64")
        fs.writeFileSync(outputPath, fileData)
        console.log(`✅ Arquivo baixado com sucesso: ${outputPath}`)
        console.log(`📊 Tamanho: ${fileData.length} bytes`)
        return true
      } else {
        console.error("❌ Arquivo não encontrado ou erro no download")
        return false
      }
    } catch (error) {
      console.error("❌ Erro ao baixar arquivo:", error.message)
      return false
    }
  }

  async listFiles(roomName) {
    try {
      console.log(`📋 Listando arquivos da sala: ${roomName}`)

      const result = await this.client.list_filesAsync({
        room_name: roomName,
      })

      if (result[0] && result[0].files) {
        const files = Array.isArray(result[0].files) ? result[0].files : [result[0].files]
        console.log(`✅ Encontrados ${files.length} arquivo(s):`)

        files.forEach((file, index) => {
          console.log(`\n📄 Arquivo ${index + 1}:`)
          console.log(`   ID: ${file.file_id}`)
          console.log(`   Nome: ${file.filename}`)
          console.log(`   Tamanho: ${file.file_size} bytes`)
          console.log(`   Data: ${file.upload_date}`)
          console.log(`   Sala: ${file.room_name}`)
        })
        return files
      } else {
        console.log("📭 Nenhum arquivo encontrado nesta sala")
        return []
      }
    } catch (error) {
      console.error("❌ Erro ao listar arquivos:", error.message)
      return []
    }
  }

  async showMenu() {
    console.log("\n🎯 === MENSAGEIRO SOAP CLIENT ===")
    console.log("1. 📤 Upload de arquivo")
    console.log("2. 📥 Download de arquivo")
    console.log("3. 📋 Listar arquivos de uma sala")
    console.log("4. 🔍 Mostrar informações do WSDL")
    console.log("5. 🧪 Testar conexão")
    console.log("6. ❌ Sair")
    console.log("================================")
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve)
    })
  }

  async showWSDL() {
    try {
      console.log("\n📋 === INFORMAÇÕES DO WSDL ===")
      console.log(`🔗 URL: ${SOAP_URL}`)

      if (this.client) {
        const description = this.client.describe()
        console.log("\n🏷️  Principais Tags do WSDL:")
        console.log("   • <definitions>: Define o namespace e importações")
        console.log("   • <types>: Define os tipos de dados complexos")
        console.log("   • <message>: Define as mensagens de entrada e saída")
        console.log("   • <portType>: Define as operações disponíveis")
        console.log("   • <binding>: Define como as mensagens são transmitidas")
        console.log("   • <service>: Define os endpoints do serviço")

        console.log("\n🔧 Operações disponíveis:")
        Object.keys(description).forEach((serviceName) => {
          Object.keys(description[serviceName]).forEach((portName) => {
            Object.keys(description[serviceName][portName]).forEach((operation) => {
              console.log(`   • ${operation}: ${this.getOperationDescription(operation)}`)
            })
          })
        })

        console.log("\n📊 Estrutura do Cliente SOAP:")
        console.log("   • Linguagem: Node.js")
        console.log("   • Biblioteca: soap (npm)")
        console.log("   • Protocolo: SOAP 1.1")
        console.log("   • Transporte: HTTP")
        console.log("   • Formato: XML")

        console.log("\n🔄 Como o cliente utiliza o WSDL:")
        console.log("   1. Faz requisição GET para obter o WSDL")
        console.log("   2. Parseia o XML para extrair operações e tipos")
        console.log("   3. Cria métodos JavaScript para cada operação")
        console.log("   4. Serializa parâmetros para XML SOAP")
        console.log("   5. Envia requisição POST com envelope SOAP")
        console.log("   6. Deserializa resposta XML para objeto JavaScript")
      } else {
        console.log("❌ Cliente não conectado. Conecte-se primeiro.")
      }
    } catch (error) {
      console.error("❌ Erro ao mostrar WSDL:", error.message)
    }
  }

  async testConnection() {
    console.log("\n🧪 === TESTE DE CONEXÃO ===")
    const connected = await this.connect()
    if (connected) {
      console.log("✅ Conexão estabelecida com sucesso!")
      console.log("🔧 Serviço SOAP está funcionando corretamente")
    } else {
      console.log("❌ Falha na conexão")
      console.log("💡 Verifique se:")
      console.log("   • O servidor SOAP está rodando")
      console.log("   • A porta 8001 está disponível")
      console.log("   • Não há firewall bloqueando a conexão")
    }
  }

  getOperationDescription(operation) {
    const descriptions = {
      upload_file: "Faz upload de arquivo para uma sala",
      download_file: "Baixa arquivo pelo ID",
      list_files: "Lista arquivos de uma sala",
    }
    return descriptions[operation] || "Operação SOAP"
  }

  async run() {
    console.log("🚀 Iniciando cliente SOAP do Mensageiro...")

    const connected = await this.connect()
    if (!connected) {
      console.log("❌ Não foi possível conectar ao serviço SOAP")
      console.log("💡 Execute 'npm install' para instalar as dependências")
      this.rl.close()
      return
    }

    while (true) {
      await this.showMenu()
      const choice = await this.question("Escolha uma opção: ")

      switch (choice) {
        case "1":
          const username = await this.question("👤 Nome do usuário: ")
          const roomName = await this.question("🏠 Nome da sala: ")
          const filePath = await this.question("📁 Caminho do arquivo: ")
          const description = await this.question("📝 Descrição (opcional): ")
          await this.uploadFile(username, roomName, filePath, description)
          break

        case "2":
          const fileId = await this.question("🆔 ID do arquivo: ")
          const outputPath = await this.question("💾 Caminho para salvar: ")
          await this.downloadFile(fileId, outputPath)
          break

        case "3":
          const listRoomName = await this.question("🏠 Nome da sala: ")
          await this.listFiles(listRoomName)
          break

        case "4":
          await this.showWSDL()
          break

        case "5":
          await this.testConnection()
          break

        case "6":
          console.log("👋 Encerrando cliente SOAP...")
          this.rl.close()
          return

        default:
          console.log("❌ Opção inválida!")
      }

      await this.question("\n⏸️  Pressione Enter para continuar...")
    }
  }
}

// Executar cliente se chamado diretamente
if (require.main === module) {
  const client = new MensageiroSOAPClient()
  client.run().catch(console.error)
}

module.exports = MensageiroSOAPClient
