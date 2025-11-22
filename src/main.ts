import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Cookie parser
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix("api");

  // Enable CORS if needed
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle("DevTinder API")
    .setDescription(
      "DevTinder Backend API Documentation - Connect developers and build amazing teams"
    )
    .setVersion("1.0")
    .addTag("auth", "Authentication endpoints")
    .addTag("users", "User management endpoints")
    .addTag("connections", "Connection request endpoints")
    .addTag("health", "Health check endpoint")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Enter your JWT access token",
        in: "header",
      },
      "JWT-auth"
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    customSiteTitle: "DevTinder API Docs",
    customfavIcon: "https://nestjs.com/img/logo-small.svg",
    customCss: ".swagger-ui .topbar { display: none }",
  });

  await app.listen(3000);
  console.log("🚀 Server is running on http://localhost:3000");
  console.log("📚 API endpoints available at http://localhost:3000/api");
  console.log(
    "📖 API documentation available at http://localhost:3000/api/docs"
  );
}
bootstrap();
