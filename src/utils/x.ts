import { spawnSync, type SpawnSyncOptions } from "node:child_process";

/**
 * Options pour l'exécution d'une commande
 */
interface ExecOptions extends SpawnSyncOptions {}

/**
 * Résultat de l'exécution d'une commande
 */
interface ExecResult {
  /** Sortie standard de la commande */
  stdout: string;
  /** Sortie d'erreur de la commande */
  stderr: string;
  /** Code de sortie de la commande (null si la commande n'a pas pu être exécutée) */
  exitCode: number | null;
}

/**
 * Exécute une commande synchrone et retourne son résultat
 * @param command La commande à exécuter
 * @param args Les arguments de la commande
 * @param options Options supplémentaires pour l'exécution
 * @returns Le résultat de l'exécution contenant stdout, stderr et le code de sortie
 */
export function x(
  command: string,
  args: string[] = [],
  options: ExecOptions = {}
): ExecResult {
  // Fusionner les options par défaut avec celles fournies
  const spawnOptions: SpawnSyncOptions = {
    encoding: "utf8",
    stdio: "pipe",
    ...options
  };

  // Exécuter la commande
  const result = spawnSync(command, args, spawnOptions);

  // Traiter et normaliser le résultat
  return {
    stdout: normalizeOutput(result.stdout),
    stderr: normalizeOutput(result.stderr),
    exitCode: result.status
  };
}

/**
 * Normalise une sortie de commande en chaîne de caractères
 * @param output Sortie potentiellement nulle ou bufferisée
 * @returns Chaîne de caractères normalisée et nettoyée
 */
function normalizeOutput(output: unknown): string {
  if (!output) return "";
  const stringOutput = typeof output === 'string' ? output : String(output);
  return stringOutput.trim();
}