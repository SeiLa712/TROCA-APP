// importação do model
const usuarioModel = require("../models/usuarioModel.js")

// importar pacotes
// para criptrograffia
const bcrypt = require('bcrypt')
// para lidar com cookies
const jwt = require('jsonwebtoken')


module.exports = {
    //FUNÇÕES DE LOGIN
    login: async (req,res) =>{
        try{
            // Pega as infomações das caixinhas da view, de acordo com o name delas
            const { email, senha } = req.body
            
            // Executa a função de busca no model
            const usuario = await usuarioModel.buscarPorEmail(email)
            // Se não existir, mensagem de erro
            if (!usuario) return res.status(404).render('erro', { mensagem: "Credenciais inválidas"})

            // compara a senha que o usuário digitou, com a senha do usuario retornado no banco
            const senhaValida = await bcrypt.compare(senha, usuario.senha)
            // Se senhas não coincidirem, mensagem de erro
            if (!senhaValida) return res.status(404).render('erro', { mensagem: "Credenciais inválidas"})

            // Gera o token de acesso, contendo o perfil 
            const token = jwt.sign(
                {id: usuario.id, perfil: usuario.perfil, nome: usuario.nome},
                process.env.JWT_SECRET,
                {expiresIn: '2h'}       
            )

            // Guardar o token nos cookies do navegador
            res.cookie('token', token, { httpOnly: true })

            // Redirecionamento de acordo com o perfil 
            if(usuario.perfil === "administrador") return res.redirect("/usuarios")
            if(usuario.perfil === "ofertante") return res.redirect("/produtos/meus-produtos")
            if(usuario.perfil === "interessado") return res.redirect("/produtos/vitrine")
        }
        catch(erro){
            res.status(500).render('erro', { mensagem: "Erro interno no servidor"})
        }
    },

    logout: (req,res) =>{
        //Limpa o token dos cookies
        res.clearCookie('token')
        // Volta pra tela de login
        res.redirect("/login")
    },

    //CRUD
    //CRIAR USUARIOS
    renderizarCadastro:(req, res) => {
        res.render('usuarios/cadastrar')
    },

    cadastrar: async(req,res) =>{
        //objeto com as informações preenchidas nos inputs
        const { nome, email, senha, telefone, perfil } = req.body

        if(perfil === 'administrador'){
            return res.status(403).render('erro', { mensagem: "Você não possui acesso"})
        }

        //multer salva a imagem na pasta, e a variavel guarda o nome dela caso o duuario tenha anexado uma imagem
        const fotoDaPessoa = req.file ? 'uploads/usuarios/$(req.file.name)' : null

        //criptografa a senha do usuario
        const senhaHash = await bcrypt.hash(senha, 10)

        //chama o model passando as informações já corrigidas
        await usuarioModel.criarUsuario(nome, email, senhaHash, telefone, fotoDaPessoa, perfil)
        //variavel pra guardar onde tem de redirecionar o usuario
        let redirecionadoPara = '/login'
        //verifica se ja tem alguem logado, analisando se ha algum token salvo
        if(req.cookies && req.cookies.token){
            try{
                const decodificado = jwt.verify(req.cookies.token, process.env.JWT_SECRET)
                if (decodificado.perfil === 'administrador') {
                    redirecionadoPara = '/usuarios'
                }
            }
            catch (erro){
                //segue o jogoindo pra login msm
            }
        }
        //ao fim, redireciona o susuario para onde ele tem q ir, /login ou /usuarios
        res.redirect(redirecionadoPara)
    },

    catch(erro){
        console.error(erro)
        res.status(500).render('erro',
             { mensagem: "Erro interno no servidor"})
    
    }
    ,

    //READ - listar usuários
    listar: async (req,res) =>{
        try{
            //se deu certo, mostra a página de usuário 
            const usuarios = await usuarioModel.listarUsuarios()
            
            res.render('usuarios/listar2', { usuarios })
        }
        catch(erro){
            //se deu erro, mostra a tela de erro padrão pra pessoa
            res.status(500).render('erro', { mensagem: "Erro ao listar usuários"})
        }
    },

    //DELETE - deletar usuário
    deletar: async (req,res) =>{
        try{
            //pega o id do usuário, vindo da url da requisição
            const idVindoDaUrl = req.params.id

            //chama a função do model, passando o id do usuário
            await usuarioModel.deletarUsuario(idVindoDaUrl)

            //se deu certo, redireciona pra página de usuários
            res.redirect("/usuarios")
        }
        catch(erro){
        //se deu erro, mostra a tela de erro padrão para pessoa
        res.status(500).render('erro', { mensagem: "Erro ao deletar usuário"})
        }
    },

    // UPDATE - ATUALIZAR UM USUARIO COM BASE NO ID
    //RENDERIZA A PÁGINA DE CADASTRO
    editar: async (req,res) =>{
        try{
            //BUSCA O ID DO USUARIO VINDO DA URL DA REQUISIÇÃO ATRAVES DO RES.PARAMS
            //exemplo: editar/5 <- é o id do individuo
            const idVindoDaUrl = req.params.id
            
            //CHAMA O MODEL PARA BUSCAR AS INFORMAÇÕES
            const usuarioEditado = await usuarioModel.buscarPorId(idVindoDaUrl)

            // renderiza a página de editar, já com o formulário preenchido com as informações
            res.render('usuarios/editar', { usuarioEditado })

        }catch(erro){
            res.status(500).render('erro', { mensagem: "Erro ao abrir tela de edição"})
        }
    },
    //ATUALIZA O USUARIO COM AS NOVAS INFORMAÇÕES
    atualizarUsuario: async (req,res) =>{
        try{
            const idVindoDaUrl = req.params.id

            // Cria um objeto com as informações das caixinhas
            const {nome, email, senha, telefone, perfil} = req.body

            // Resgata o caminho da foto, vindo do multer
            const fotoDaPessoa = req.file ? `/uploads/usuarios/${req.file.filename}` : null

            // Parte da senha, caso necessário
            let senhaHash
            if(senha && senha.trim() !== ''){
                //Se o campo senha estiver preenchido, criptografia a nova senha
                senhaHash = await bcrypt.hash(senha,10)
            }
            else{
                //SE o campo senha estiver em branco, deixa a mesma que tava antes
                const usuarioAntigo = await usuarioModel.buscarPorId(idVindoDaUrl)
                senhaHash = usuarioAntigo.senha
            }

            // Chamar o model, e atualizar o usuário
            await usuarioModel.atualizarUsuario(idVindoDaUrl, nome, email, senhaHash, telefone, fotoDaPessoa, perfil)
            res.redirect("/usuarios")
        }
        catch(erro){
            res.status(500).render('erro',{mensagem: "Erro ao editar usuário"})
        }
    },

}

