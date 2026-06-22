# BarberPro

Sistema web de gestão para barbearias — agendamento de horários, controle de clientes e agenda de barbeiros.

Projeto acadêmico desenvolvido para a disciplina de Engenharia de Software (UNICEP) — Trabalho 2: Implementação Web, Qualidade e Implantação.

## Stack tecnológica

- **Backend:** Node.js + Express
- **Frontend:** HTML, CSS e JavaScript puro
- **Banco de dados:** SQLite (via módulo nativo `node:sqlite`, sem dependências nativas externas)
- **Autenticação:** JWT + bcrypt
- **Testes:** Jest + Supertest
- **Implantação:** Docker + Docker Compose
- **CI/CD:** GitHub Actions

## Requisitos

- Para rodar com Docker (recomendado): Docker e Docker Compose instalados.
- Para rodar sem Docker: Node.js **22.5 ou superior** (o projeto usa o módulo experimental `node:sqlite`, disponível a partir dessa versão).

## Como executar com Docker Compose (recomendado)

```bash
git clone <url-do-repositorio>
cd barberpro
docker compose up --build
```

O sistema estará disponível em **http://localhost:3000**.

Os dados são persistidos em um volume Docker (`barberpro_data`), portanto sobrevivem a reinicializações do container. Para reiniciar do zero, remova o volume:

```bash
docker compose down -v
```

## Como executar sem Docker (Node.js local)

```bash
cd backend
npm install
npm start
```

O sistema estará disponível em **http://localhost:3000**. O banco SQLite será criado automaticamente em `backend/data/barberpro.db`.

## Variáveis de ambiente

| Variável     | Padrão                          | Descrição                                  |
|--------------|----------------------------------|---------------------------------------------|
| `PORT`       | `3000`                           | Porta em que o servidor escuta              |
| `DB_PATH`    | `backend/data/barberpro.db`      | Caminho do arquivo SQLite                   |
| `JWT_SECRET` | valor de desenvolvimento inseguro| Segredo usado para assinar tokens JWT. **Defina um valor forte em produção.** |

## Executando os testes

```bash
cd backend
npm install
npm test
```

A suíte contém 18 testes automatizados, incluindo:
- Testes unitários das regras de negócio RN01 (não permitir horários duplicados) e RN02 (cancelamento até 1h antes).
- Testes de integração via Supertest cobrindo a API completa.
- Um teste de fluxo completo (end-to-end): cadastro → login → consulta de horários → agendamento → tentativa de conflito → listagem → cancelamento → confirmação de horário liberado.

## Estrutura do projeto

```
barberpro/
├── backend/           API REST (Node.js + Express + SQLite)
├── frontend/          Interface web (HTML/CSS/JS puro)
├── docs/              Documentação do trabalho e protótipos
├── .github/workflows/ Pipeline de CI/CD
├── Dockerfile
└── docker-compose.yml
```

## Usuários de exemplo

Não há usuários pré-cadastrados — utilize a tela de "Criar conta" para registrar um cliente e um barbeiro de teste. Os serviços (Corte de Cabelo, Barba, Corte + Barba, Sobrancelha) já vêm pré-cadastrados automaticamente na primeira inicialização do banco de dados.

## Licença

Projeto acadêmico sem fins comerciais.
