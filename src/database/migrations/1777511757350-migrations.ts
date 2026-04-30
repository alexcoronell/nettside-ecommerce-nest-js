import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1777511757350 implements MigrationInterface {
  name = 'Migrations1777511757350';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_c94df37f1df2bbbbe6212e04d5d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" RENAME COLUMN "uploaded_by" TO "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_70f820611cd702e086905784397" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "product_images" DROP CONSTRAINT "FK_70f820611cd702e086905784397"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" RENAME COLUMN "created_by" TO "uploaded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "product_images" ADD CONSTRAINT "FK_c94df37f1df2bbbbe6212e04d5d" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }
}
