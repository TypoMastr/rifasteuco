# Backend API for Rifas TEUCO App

Este documento descreve os endpoints da API que a aplicação frontend espera. Você precisa criar um serviço de backend (por exemplo, usando Node.js/Express, Python/Flask, PHP/Laravel, etc.) que implemente esses endpoints e interaja com seu banco de dados MySQL.

O frontend envia e espera dados no formato JSON.

## Endpoints da API

### Rifas

-   **`GET /api/raffles`**
    -   **Descrição:** Busca todas as rifas. Cada objeto de rifa deve incluir seus arrays `sales` e `costs`.
    -   **Resposta:** `200 OK` com `Raffle[]`.

-   **`POST /api/raffles`**
    -   **Descrição:** Cria uma nova rifa.
    -   **Corpo da Requisição:** `Omit<Raffle, 'id' | 'sales' | 'costs'>`
    -   **Resposta:** `201 Created` com o objeto `Raffle` recém-criado (incluindo o ID gerado pelo servidor). Isso também deve criar um log de histórico `CREATE_RAFFLE`.

-   **`PUT /api/raffles/:raffleId`**
    -   **Descrição:** Atualiza os detalhes principais de uma rifa (título, data, etc.).
    -   **Corpo da Requisição:** `Omit<Raffle, 'sales' | 'costs'>`
    -   **Resposta:** `200 OK` com o objeto `Raffle` atualizado. Isso também deve criar um log de histórico `UPDATE_RAFFLE` ou `TOGGLE_FINALIZE_RAFFLE`.

-   **`DELETE /api/raffles/:raffleId`**
    -   **Descrição:** Deleta uma rifa e todas as suas vendas e custos associados.
    -   **Resposta:** `204 No Content`. Isso também deve criar um log de histórico `DELETE_RAFFLE`.

### Lançamentos (Vendas e Custos)

-   **`POST /api/raffles/:raffleId/entries`**
    -   **Descrição:** Adiciona uma nova venda ou custo a uma rifa específica.
    -   **Corpo da Requisição:** Um objeto contendo `{ type: 'sale' | 'cost', ...entryData }`.
    -   **Resposta:** `201 Created` com o objeto `Raffle` completo e atualizado. Isso deve criar um log de histórico `ADD_SALE` ou `ADD_COST`.

-   **`PUT /api/raffles/:raffleId/entries/:entryId`**
    -   **Descrição:** Atualiza uma venda ou custo existente.
    -   **Corpo da Requisição:** Um objeto contendo `{ type: 'sale' | 'cost', ...entryData }`.
    -   **Resposta:** `200 OK` com o objeto `Raffle` completo e atualizado. Isso deve criar um log de histórico `UPDATE_SALE`, `UPDATE_COST`, `ADD_REIMBURSEMENT` ou `DELETE_REIMBURSEMENT`.

-   **`DELETE /api/raffles/:raffleId/entries/:entryId`**
    -   **Descrição:** Deleta uma venda ou custo específico.
    -   **Parâmetro de Query:** `?type=sale` ou `?type=cost` é necessário para saber de qual tabela deletar.
    -   **Resposta:** `200 OK` com o objeto `Raffle` completo e atualizado. Isso deve criar um log de histórico `DELETE_SALE` ou `DELETE_COST`.

### Histórico

-   **`GET /api/history`**
    -   **Descrição:** Busca todos os logs de histórico, ordenados do mais recente para o mais antigo.
    -   **Resposta:** `200 OK` com `HistoryLog[]`.

-   **`POST /api/history/undo/:logId`**
    -   **Descrição:** Reverte uma ação específica com base no ID do log. Sua lógica de backend precisará lidar com a reversão para cada `actionType`. Após reverter, o log deve ser marcado como `undone`.
    -   **Resposta:** `204 No Content`.

## Conexão com o Banco de Dados

Seu servidor de backend deve usar as credenciais de banco de dados que você forneceu para se conectar à sua instância MySQL. **Não** exponha essas credenciais ao frontend.
