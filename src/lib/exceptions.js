class HttpException extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
  }
}

class BadRequestException extends HttpException {
  constructor(message = "Bad Request", details = null) {
    super(400, message, details);
  }
}

class UnauthorizedException extends HttpException {
  constructor(message = "Unauthorized") {
    super(401, message);
  }
}

class ForbiddenException extends HttpException {
  constructor(message = "Forbidden") {
    super(403, message);
  }
}

class NotFoundException extends HttpException {
  constructor(message = "Not Found") {
    super(404, message);
  }
}

class ConflictException extends HttpException {
  constructor(message = "Conflict") {
    super(409, message);
  }
}

class ValidationException extends HttpException {
  constructor(errors) {
    super(400, "Validation Failed", errors);
  }
}

module.exports = {
  HttpException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  ValidationException,
};
