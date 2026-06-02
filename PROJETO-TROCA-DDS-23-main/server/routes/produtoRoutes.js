// importação do módulo express
const express = require("express");
const router = express.Router();

// rota de produtos genérica
router.get("/meus-produtos", (req, res) => {
  res.status(404).render('erro', { mensagem: "essa página ainda não existe"});});

// rota de saída
router.get("/vitrine", (req, res) => {
  res.status(404).render('erro', { mensagem: "essa página ainda não existe"})});
    

module.exports = router;