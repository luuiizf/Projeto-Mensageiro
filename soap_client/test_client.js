const MensageiroSOAPClient = require("./client")
const fs = require("fs")
const path = require("path")

async function runTests() {
  console.log("🧪 === TESTES DO CLIENTE SOAP ===\n")

  const client = new MensageiroSOAPClient()

  // Teste 1: Conexão
  console.log("🔗 Teste 1: Conectando ao serviço SOAP...")
  const connected = await client.connect()
  if (!connected) {
    console.log("❌ Falha na conexão - encerrando testes")
    return
  }
  console.log("✅ Conexão bem-sucedida\n")

  // Criar arquivo de teste
  const testFileName = "test_file.txt"
  const testContent = "Este é um arquivo de teste para o sistema Mensageiro SOAP\nData: " + new Date().toISOString()
  fs.writeFileSync(testFileName, testContent)
  console.log(`📝 Arquivo de teste criado: ${testFileName}\n`)

  // Teste 2: Upload de arquivo
  console.log("📤 Teste 2: Upload de arquivo...")
  const uploadResult = await client.uploadFile(
    "usuario_teste",
    "sala_teste",
    testFileName,
    "Arquivo de teste automatizado",
  )

  if (!uploadResult) {
    console.log("❌ Falha no upload")
    return
  }
  console.log("✅ Upload bem-sucedido\n")

  // Teste 3: Listar arquivos
  console.log("📋 Teste 3: Listando arquivos da sala...")
  const files = await client.listFiles("sala_teste")
  console.log(`✅ Listagem concluída - ${files.length} arquivo(s) encontrado(s)\n`)

  // Teste 4: Download de arquivo
  if (uploadResult && uploadResult.file_id) {
    console.log("📥 Teste 4: Download de arquivo...")
    const downloadPath = `downloaded_${testFileName}`
    const downloadSuccess = await client.downloadFile(uploadResult.file_id, downloadPath)

    if (downloadSuccess) {
      console.log("✅ Download bem-sucedido")

      // Verificar se o conteúdo é o mesmo
      const originalContent = fs.readFileSync(testFileName, "utf8")
      const downloadedContent = fs.readFileSync(downloadPath, "utf8")

      if (originalContent === downloadedContent) {
        console.log("✅ Conteúdo verificado - arquivos são idênticos")
      } else {
        console.log("❌ Conteúdo diferente entre arquivos")
      }

      // Limpar arquivo baixado
      fs.unlinkSync(downloadPath)
    } else {
      console.log("❌ Falha no download")
    }
  }

  // Teste 5: Mostrar informações do WSDL
  console.log("\n📋 Teste 5: Informações do WSDL...")
  await client.showWSDL()

  // Limpeza
  fs.unlinkSync(testFileName)
  console.log(`\n🧹 Arquivo de teste removido: ${testFileName}`)

  console.log("\n🎉 === TODOS OS TESTES CONCLUÍDOS ===")

  // Fechar interface readline
  client.rl.close()
}

// Executar testes
runTests().catch(console.error)
