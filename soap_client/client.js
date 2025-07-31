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

      console.log(`📤 Enviando arquivo: ${filename}`)
      console.log(`👤 Usuário: ${username}`)
      console.log(`🏠 Sala: ${roomName}`)
      console.log(`📝 Descrição: ${description || "Sem descrição"}`)
      console.log(`📊 Tamanho: ${fileData.length} bytes`)

      const result = await this.client.upload_fileAsync({
        username: username,
        room_name: roomName,
        filename: filename,
        file_data: fileData,
        description: description,
      })

      if (result[0].success) {
        console.log("✅ Upload realizado com sucesso!")
        console.log("📄 Informações do arquivo:")
        console.log(`   ID: ${result[0].file_info.file_id}`)
        console.log(`   Nome: ${result[0].file_info.filename}`)
        console.log(`   Tamanho: ${result[0].file_info.file_size} bytes`)
        console.log(`   Data: ${result[0].file_info.upload_date}`)
        console.log(`   Usuário: ${result[0].file_info.uploader_username}`)
        console.log(`   Sala: ${result[0].file_info.room_name}`)
        return result[0].file_info
      } else {
        console.error("❌ Erro no upload:", result[0].message)
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

      if (result[0]) {
        fs.writeFileSync(outputPath, result[0])
        console.log(`✅ Arquivo baixado com sucesso: ${outputPath}`)
        console.log(`📊 Tamanho: ${result[0].length} bytes`)
        return true
      } else {
        console.error("❌ Arquivo não encontrado")
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

      if (result[0] && result[0].length > 0) {
        console.log(`✅ Encontrados ${result[0].length} arquivo(s):`)
        result[0].forEach((file, index) => {
          console.log(`\n📄 Arquivo ${index + 1}:`)
          console.log(`   ID: ${file.file_id}`)
          console.log(`   Nome: ${file.filename}`)
          console.log(`   Tamanho: ${file.file_size} bytes`)
          console.log(`   Data: ${file.upload_date}`)
          console.log(`   Sala: ${file.room_name}`)
        })
        return result[0]
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
    console.log("4. 🔍 Mostrar WSDL")
    console.log("5. ❌ Sair")
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
    } catch (error) {
      console.error("❌ Erro ao mostrar WSDL:", error.message)
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
