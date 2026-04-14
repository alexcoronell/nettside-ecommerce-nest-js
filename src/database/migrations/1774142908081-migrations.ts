import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1774142908081 implements MigrationInterface {
  name = 'Migrations1774142908081';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "subcategories" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "category_id" integer, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_290ef46936579a55f65f81f5e4c" UNIQUE ("slug"), CONSTRAINT "PK_793ef34ad0a3f86f09d4837007c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_discounts" ("product_id" integer NOT NULL, "discount_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_user_id" integer NOT NULL, CONSTRAINT "UQ_fb73d2ec2c65bb88066e43a7d03" UNIQUE ("product_id", "discount_id"), CONSTRAINT "PK_fb73d2ec2c65bb88066e43a7d03" PRIMARY KEY ("product_id", "discount_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "discounts" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "code" character varying(255) NOT NULL, "description" text NOT NULL, "type" character varying(50) NOT NULL, "value" numeric(10,2) NOT NULL, "start_date" TIMESTAMP NOT NULL, "end_date" TIMESTAMP, "minimum_order_amount" numeric(10,2) NOT NULL DEFAULT '0', "usage_limit" integer, "usage_limit_per_user" integer, "active" boolean NOT NULL DEFAULT false, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "PK_66c522004212dc814d6e2f14ecc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "shipping_companies" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "contact_name" character varying(255) NOT NULL, "phone_number" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_1f03c466e47e3ead5f2cab2ac28" UNIQUE ("name"), CONSTRAINT "UQ_221d5888a11f2ef225b53f98481" UNIQUE ("contact_name"), CONSTRAINT "UQ_92ad65d9a6a57bf6e8af4d54bb8" UNIQUE ("email"), CONSTRAINT "PK_122b86979b5555bc48d807d7f13" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."shipments_status_enum" AS ENUM('Label Created', 'In Transit', 'Out for Delivery', 'Delivered', 'Attempted Delivery', 'Held at Facility', 'Lost', 'Returned to Sender')`,
    );
    await queryRunner.query(
      `CREATE TABLE "shipments" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "tracking_number" character varying(100) NOT NULL, "shipment_date" TIMESTAMP, "estimated_delivery_date" TIMESTAMP, "status" "public"."shipments_status_enum" NOT NULL DEFAULT 'Label Created', "sale_id" integer, "shipping_company_id" integer, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_376e793e69f13a28648e1741b70" UNIQUE ("tracking_number", "shipping_company_id"), CONSTRAINT "PK_6deda4532ac542a93eab214b564" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "sale_detail" ("id" SERIAL NOT NULL, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "sale_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "UQ_5c834a675e4e5161cd1d221459a" UNIQUE ("sale_id", "product_id"), CONSTRAINT "PK_4a2e151a26169857b1f3d47c198" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."sales_shipping_status_enum" AS ENUM('Pending Payment', 'Pending Failed', 'Processing', 'Ready for Shipment', 'Shipped', 'Delivered', 'Completed', 'Cancelled', 'Refunded', 'Failed')`,
    );
    await queryRunner.query(
      `CREATE TABLE "sales" ("id" SERIAL NOT NULL, "sale_date" TIMESTAMP NOT NULL DEFAULT now(), "total_amount" numeric(10,2) NOT NULL DEFAULT '0', "shipping_address" character varying(255) NOT NULL, "shipping_status" "public"."sales_shipping_status_enum" NOT NULL DEFAULT 'Pending Payment', "cancelled_at" TIMESTAMP DEFAULT now(), "is_cancelled" boolean NOT NULL DEFAULT false, "user_id" integer, "cancelled_by_user_id" integer, "payment_method_id" integer, CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "payment_methods" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_a793d7354d7c3aaf76347ee5a66" UNIQUE ("name"), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_images" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "file_path" character varying(256) NOT NULL, "title" character varying(256) NOT NULL, "is_main" boolean NOT NULL DEFAULT false, "is_active" boolean NOT NULL DEFAULT true, "product_id" integer, "uploaded_by" integer, "updated_by" integer, CONSTRAINT "PK_1974264ea7265989af8392f63a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "purchase_details" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "quantity" integer NOT NULL DEFAULT '1', "unit_price" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) NOT NULL, "purchase_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "UQ_de27b4793e5a45ab80f2160ea06" UNIQUE ("purchase_id", "product_id"), CONSTRAINT "PK_d3ebfb1c6f9af260a2a63af7204" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "purchases" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "purchase_date" TIMESTAMP NOT NULL DEFAULT now(), "total_amount" numeric(10,2) NOT NULL, "created_by_user_id" integer NOT NULL, "updated_by_user_id" integer NOT NULL, "deleted_by_user_id" integer, "supplier_id" integer NOT NULL, CONSTRAINT "PK_1d55032f37a34c6eceacbbca6b8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "suppliers" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "contact_name" character varying(255) NOT NULL, "phone_number" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_5b5720d9645cee7396595a16c93" UNIQUE ("name"), CONSTRAINT "UQ_973ef1681425ad1146fbbeafe1d" UNIQUE ("contact_name"), CONSTRAINT "UQ_66181e465a65c2ddcfa9c00c9c7" UNIQUE ("email"), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "product_suppliers" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "supplier_product_code" character varying(256) NOT NULL, "cost_price" numeric(10,2) NOT NULL DEFAULT '0', "is_primary_supplier" boolean NOT NULL DEFAULT false, "product_id" integer, "supplier_id" integer, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "PK_96f9e4cfe1a097fdd2a9a67257a" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "tags" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_d90243459a697eadb8ad56e9092" UNIQUE ("name"), CONSTRAINT "PK_e7dc17249a1148a1970748eda99" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products_tags" ("product_id" integer NOT NULL, "tag_id" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_user_id" integer, CONSTRAINT "PK_cbd06afc39cd795196e15bcc72d" PRIMARY KEY ("product_id", "tag_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "store_details" ("id" integer NOT NULL DEFAULT '1', "name" character varying(255), "country" character varying(255), "state" character varying(255), "city" character varying(255), "neighborhood" character varying(255), "address" character varying(255), "phone" character varying(20), "email" character varying(100), "legal_information" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_by_user_id" integer, "updated_by_user_id" integer, CONSTRAINT "CHK_5e6beef10038d72c7549b4eb10" CHECK ("id" = 1), CONSTRAINT "PK_b41a87303905e09f6fd85641407" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('Admin', 'Seller', 'Customer')`,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "first_name" character varying(255) NOT NULL, "last_name" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password" character varying(255) NOT NULL, "phone_number" character varying(255) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "role" "public"."users_role_enum" NOT NULL DEFAULT 'Customer', "department" character varying(100) NOT NULL, "city" character varying(100) NOT NULL, "address" character varying(255) NOT NULL, "neighborhood" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "brands" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "UQ_96db6bbbaa6f23cad26871339b6" UNIQUE ("name"), CONSTRAINT "UQ_b15428f362be2200922952dc268" UNIQUE ("slug"), CONSTRAINT "PK_b0c437120b624da1034a81fc561" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "products" ("id" SERIAL NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "is_deleted" boolean NOT NULL DEFAULT false, "name" character varying(255) NOT NULL, "description" text NOT NULL, "price" numeric(10) NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "category_id" integer, "subcategory_id" integer, "brand_id" integer, "created_by_user_id" integer, "updated_by_user_id" integer, "deleted_by_user_id" integer, CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wishlist" ("id" SERIAL NOT NULL, "added_date" TIMESTAMP NOT NULL DEFAULT now(), "user_id" integer NOT NULL, "product_id" integer NOT NULL, CONSTRAINT "UQ_c00c97c645a6be88349354e8f38" UNIQUE ("user_id", "product_id"), CONSTRAINT "PK_620bff4a240d66c357b5d820eaa" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_8d6a231bb3ca1c4fdcc8fd576bb" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_5ce4208f434c6232bb8a5623c6b" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" ADD CONSTRAINT "FK_3d9d2d64a6c59f88b072894b978" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_cde241e5066aa7c082d32b3b320" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_7525db2d81f00470995caf5991a" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" ADD CONSTRAINT "FK_e01b98187d039aa448877c964f2" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" ADD CONSTRAINT "FK_1d869169a655cbdf787d86ea745" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" ADD CONSTRAINT "FK_68e668b0341f0276ebcc2a91506" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" ADD CONSTRAINT "FK_4d3f74396271c6bee81a1a547a0" FOREIGN KEY ("discount_id") REFERENCES "discounts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_2ccc2274a324a4a2059d8af4c59" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_84fd406dd8c0aae51a0a741491b" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" ADD CONSTRAINT "FK_2bfecd199eed6a03dbebd5da919" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" ADD CONSTRAINT "FK_49f15f37b940f5de7e783f6acd0" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" ADD CONSTRAINT "FK_c4d0a8d282575aaa40f711cb9bc" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" ADD CONSTRAINT "FK_03aa7d8acba8e6a0e430ab646ce" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_b533d593dd587e21d804e0c581d" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_5a12eea89dda83ae4c08688f9cf" FOREIGN KEY ("shipping_company_id") REFERENCES "shipping_companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_26adb813223d773e10fb79a3366" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_fb9d9cb84f7284e3b95cba6a438" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" ADD CONSTRAINT "FK_895682a559be2bda746e33b4499" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_detail" ADD CONSTRAINT "FK_f51acf047cb9b82ea8b0508f95a" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_detail" ADD CONSTRAINT "FK_6f193a6e12bed09dc343ad057ab" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_5f282f3656814ec9ca2675aef6f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_6cb2ccd2a3b2aa23c6ab9564a22" FOREIGN KEY ("cancelled_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" ADD CONSTRAINT "FK_b53046ece141355db11e7750c11" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_f6ab518f1ef0ac2ad221399b99b" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_c995cf45dce41c8718be9810faf" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" ADD CONSTRAINT "FK_a4878759f6e56ca0bc767bfbfc3" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_c94df37f1df2bbbbe6212e04d5d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_a985ebba9c49418bf96d6ec99a5" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_details" ADD CONSTRAINT "FK_7769941f7424a0030e1f6c7b7d3" FOREIGN KEY ("purchase_id") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_details" ADD CONSTRAINT "FK_802cd8f2a3c2e09932fc1bfad88" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD CONSTRAINT "FK_3d9bbd03998046359d6557f7526" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD CONSTRAINT "FK_c77fc82c7f9fd6fbf7c8be66cb9" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD CONSTRAINT "FK_e5658a71158651e46027c8fbd9c" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD CONSTRAINT "FK_d5fec047f705d5b510c19379b95" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_5fa7dd93144dd478fc3606eda1d" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_772718e7d80332bdde12cd6f52a" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" ADD CONSTRAINT "FK_84c7b1d399b9bb02697c04e154f" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" ADD CONSTRAINT "FK_c1b61c92463463f577fac49b95c" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" ADD CONSTRAINT "FK_be4a36f37c7345ab274ec4656d2" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" ADD CONSTRAINT "FK_6764e5ab172245e60e9a4020232" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" ADD CONSTRAINT "FK_b90d66a2ce63d6855f5073318f6" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" ADD CONSTRAINT "FK_ce47daf62b0c2e2c9f2763d4ca6" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_81514646f4cbf2538090ffe59c3" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_aaf486118933dd245c16bf791fa" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" ADD CONSTRAINT "FK_bb15b5ef052c9d3a414d901cc9f" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" ADD CONSTRAINT "FK_7e4506787e56acac3a072ea60d8" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" ADD CONSTRAINT "FK_5bea8057797206c034871344d9d" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" ADD CONSTRAINT "FK_050fd68b81f130e2eafca1d672d" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_details" ADD CONSTRAINT "FK_84496ff5bbd1d061df9b45297a1" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_details" ADD CONSTRAINT "FK_fcfbd816f5d412e97cba432525b" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_3402191df44bc05c18c1cbbdc92" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_2deb726a6f596b0bace60b216f0" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "FK_518416801da6ad5b2f318079a8e" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD CONSTRAINT "FK_618ed39ad534f6cefa644d104cc" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD CONSTRAINT "FK_92ef71dcf738469597325e324e6" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" ADD CONSTRAINT "FK_c6b5cd98e62566bec93e10bbaae" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_9a5f6868c96e0069e699f33e124" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a" FOREIGN KEY ("subcategory_id") REFERENCES "subcategories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_d4131ec6fde82732ee2f3a777cd" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_4fa2228c20276d6b512b4e2ddf1" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "FK_a196364b82a3cf43b2a3d7e2442" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" ADD CONSTRAINT "FK_512bf776587ad5fc4f804277d76" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" ADD CONSTRAINT "FK_16f64e06715ce4fea8257cc42c5" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "wishlist" DROP CONSTRAINT "FK_16f64e06715ce4fea8257cc42c5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist" DROP CONSTRAINT "FK_512bf776587ad5fc4f804277d76"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_a196364b82a3cf43b2a3d7e2442"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_4fa2228c20276d6b512b4e2ddf1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_d4131ec6fde82732ee2f3a777cd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_1530a6f15d3c79d1b70be98f2be"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_c9de3a8edea9269ca774c919b9a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP CONSTRAINT "FK_9a5f6868c96e0069e699f33e124"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" DROP CONSTRAINT "FK_c6b5cd98e62566bec93e10bbaae"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" DROP CONSTRAINT "FK_92ef71dcf738469597325e324e6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "brands" DROP CONSTRAINT "FK_618ed39ad534f6cefa644d104cc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_518416801da6ad5b2f318079a8e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_2deb726a6f596b0bace60b216f0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_3402191df44bc05c18c1cbbdc92"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_details" DROP CONSTRAINT "FK_fcfbd816f5d412e97cba432525b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "store_details" DROP CONSTRAINT "FK_84496ff5bbd1d061df9b45297a1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" DROP CONSTRAINT "FK_050fd68b81f130e2eafca1d672d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" DROP CONSTRAINT "FK_5bea8057797206c034871344d9d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products_tags" DROP CONSTRAINT "FK_7e4506787e56acac3a072ea60d8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_bb15b5ef052c9d3a414d901cc9f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_aaf486118933dd245c16bf791fa"`,
    );
    await queryRunner.query(
      `ALTER TABLE "tags" DROP CONSTRAINT "FK_81514646f4cbf2538090ffe59c3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" DROP CONSTRAINT "FK_ce47daf62b0c2e2c9f2763d4ca6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" DROP CONSTRAINT "FK_b90d66a2ce63d6855f5073318f6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" DROP CONSTRAINT "FK_6764e5ab172245e60e9a4020232"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" DROP CONSTRAINT "FK_be4a36f37c7345ab274ec4656d2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_suppliers" DROP CONSTRAINT "FK_c1b61c92463463f577fac49b95c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_84c7b1d399b9bb02697c04e154f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_772718e7d80332bdde12cd6f52a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "suppliers" DROP CONSTRAINT "FK_5fa7dd93144dd478fc3606eda1d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP CONSTRAINT "FK_d5fec047f705d5b510c19379b95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP CONSTRAINT "FK_e5658a71158651e46027c8fbd9c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP CONSTRAINT "FK_c77fc82c7f9fd6fbf7c8be66cb9"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP CONSTRAINT "FK_3d9bbd03998046359d6557f7526"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_details" DROP CONSTRAINT "FK_802cd8f2a3c2e09932fc1bfad88"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchase_details" DROP CONSTRAINT "FK_7769941f7424a0030e1f6c7b7d3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_a985ebba9c49418bf96d6ec99a5"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_c94df37f1df2bbbbe6212e04d5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_4f166bb8c2bfcef2498d97b4068"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_a4878759f6e56ca0bc767bfbfc3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_c995cf45dce41c8718be9810faf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_methods" DROP CONSTRAINT "FK_f6ab518f1ef0ac2ad221399b99b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_b53046ece141355db11e7750c11"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_6cb2ccd2a3b2aa23c6ab9564a22"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sales" DROP CONSTRAINT "FK_5f282f3656814ec9ca2675aef6f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_detail" DROP CONSTRAINT "FK_6f193a6e12bed09dc343ad057ab"`,
    );
    await queryRunner.query(
      `ALTER TABLE "sale_detail" DROP CONSTRAINT "FK_f51acf047cb9b82ea8b0508f95a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_895682a559be2bda746e33b4499"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_fb9d9cb84f7284e3b95cba6a438"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_26adb813223d773e10fb79a3366"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_5a12eea89dda83ae4c08688f9cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipments" DROP CONSTRAINT "FK_b533d593dd587e21d804e0c581d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" DROP CONSTRAINT "FK_03aa7d8acba8e6a0e430ab646ce"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" DROP CONSTRAINT "FK_c4d0a8d282575aaa40f711cb9bc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "shipping_companies" DROP CONSTRAINT "FK_49f15f37b940f5de7e783f6acd0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_2bfecd199eed6a03dbebd5da919"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_84fd406dd8c0aae51a0a741491b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "discounts" DROP CONSTRAINT "FK_2ccc2274a324a4a2059d8af4c59"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" DROP CONSTRAINT "FK_4d3f74396271c6bee81a1a547a0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" DROP CONSTRAINT "FK_68e668b0341f0276ebcc2a91506"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_discounts" DROP CONSTRAINT "FK_1d869169a655cbdf787d86ea745"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_e01b98187d039aa448877c964f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_7525db2d81f00470995caf5991a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "categories" DROP CONSTRAINT "FK_cde241e5066aa7c082d32b3b320"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_3d9d2d64a6c59f88b072894b978"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_5ce4208f434c6232bb8a5623c6b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_8d6a231bb3ca1c4fdcc8fd576bb"`,
    );
    await queryRunner.query(
      `ALTER TABLE "subcategories" DROP CONSTRAINT "FK_f7b015bc580ae5179ba5a4f42ec"`,
    );
    await queryRunner.query(`DROP TABLE "wishlist"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TABLE "brands"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "store_details"`);
    await queryRunner.query(`DROP TABLE "products_tags"`);
    await queryRunner.query(`DROP TABLE "tags"`);
    await queryRunner.query(`DROP TABLE "product_suppliers"`);
    await queryRunner.query(`DROP TABLE "suppliers"`);
    await queryRunner.query(`DROP TABLE "purchases"`);
    await queryRunner.query(`DROP TABLE "purchase_details"`);
    await queryRunner.query(`DROP TABLE "product_images"`);
    await queryRunner.query(`DROP TABLE "payment_methods"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TYPE "public"."sales_shipping_status_enum"`);
    await queryRunner.query(`DROP TABLE "sale_detail"`);
    await queryRunner.query(`DROP TABLE "shipments"`);
    await queryRunner.query(`DROP TYPE "public"."shipments_status_enum"`);
    await queryRunner.query(`DROP TABLE "shipping_companies"`);
    await queryRunner.query(`DROP TABLE "discounts"`);
    await queryRunner.query(`DROP TABLE "product_discounts"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP TABLE "subcategories"`);
  }
}
