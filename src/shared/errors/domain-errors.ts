export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ProductNotFoundError extends DomainError {
  constructor(public readonly productId: string) {
    super(`Produto com ID "${productId}" não foi encontrado no cardápio.`);
  }
}

export class InvalidQuantityError extends DomainError {
  constructor(message = 'Quantidade de itens inválida.') {
    super(message);
  }
}

export class InvalidPhoneError extends DomainError {
  constructor(message = 'Número de telefone/WhatsApp inválido.') {
    super(message);
  }
}

export class DuplicateOrderError extends DomainError {
  constructor(public readonly idempotencyKey: string) {
    super(`Um pedido com a chave de idempotência "${idempotencyKey}" já existe.`);
  }
}

export class PersistenceError extends DomainError {
  constructor(message = 'Erro ao persistir pedido no banco de dados.') {
    super(message);
  }
}

export class RateLimitError extends DomainError {
  constructor(message = 'Muitas requisições enviadas. Aguarde um momento antes de tentar novamente.') {
    super(message);
  }
}
