import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migrations1776267823323 implements MigrationInterface {
  name = 'Migrations1776267823323';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD "slug" character varying(255) NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "slug"`);
  }
}
