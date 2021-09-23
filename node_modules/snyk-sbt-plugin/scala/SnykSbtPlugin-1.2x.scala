package snyk

import net.virtualvoid.sbt.graph.DependencyGraphKeys.moduleGraph
import net.virtualvoid.sbt.graph.{ DependencyGraphPlugin, ModuleId }
import sbt._, Keys._
import sjsonnew.shaded.scalajson.ast._
import sjsonnew.support.scalajson.unsafe.PrettyPrinter

object SnykSbtPlugin extends AutoPlugin {
  val ConfigBlacklist: Set[String] =
    Set("windows", "universal", "universal-docs", "debian", "rpm", "universal-src", "docker", "linux", "web-assets", "web-plugin", "web-assets-test")

  case class SnykModuleInfo(version: String, configurations: Set[String])
  case class SnykProjectData(
    projectId: String,
    modules: Map[String, SnykModuleInfo],
    dependencies: Map[String, Set[String]]
  ) {
    def merge(otherModules: Map[String, SnykModuleInfo], otherDeps: Map[String, Set[String]]): SnykProjectData = {
      val mergedModules = otherModules.foldLeft(modules) {
        case (acc, (moduleName, moduleInfo)) =>
          acc.get(moduleName) match {
            case Some(existing) =>
              acc + (moduleName -> SnykModuleInfo(
                existing.version,
                existing.configurations ++ moduleInfo.configurations
              ))
            case None =>
              acc + (moduleName -> moduleInfo)
          }
      }

      val mergedDeps = dependencies ++ otherDeps

      SnykProjectData(projectId, mergedModules, mergedDeps)
    }

  }

  override def requires = sbt.plugins.JvmPlugin && DependencyGraphPlugin
  override def trigger  = allRequirements

  object autoImport {
    lazy val snykExtractProjectData = taskKey[SnykProjectData]("Extracts the dependency information for each project")
    lazy val snykRenderTree         = taskKey[Unit]("Renders the dependency information for all projects")
  }

  import autoImport._

  override lazy val globalSettings = Seq(snykRenderTree := Def.taskDyn {
    val allProjs = buildStructure.value.allProjectRefs
    val filter   = ScopeFilter(inProjects(allProjs: _*))

    Def.task {
      val allProjectDatas = snykExtractProjectData.all(filter).value
      println("Snyk Output Start")
      println(PrettyPrinter(JObject(allProjectDatas.map {
        case SnykProjectData(projectId, modules, deps) =>
          projectId -> JObject(
            Map(
              "modules" -> JObject(
                modules.mapValues { moduleInfo =>
                  JObject(
                    Map(
                      "version"        -> JString(moduleInfo.version),
                      "configurations" -> JArray(moduleInfo.configurations.toVector.map(JString))
                    )
                  )
                }
              ),
              "dependencies" -> JObject(
                deps.mapValues(vs => JArray(vs.toVector.map(JString)))
              )
            )
          )
      }.toMap).toUnsafe))
      println("Snyk Output End")
    }
  }.value)

  override lazy val projectSettings = Seq(
    snykExtractProjectData := Def.taskDyn {
      def formatModuleId(m: ModuleId) = s"${m.organisation}:${m.name}"

      val thisProjectId      = formatModuleId((Compile / moduleGraph).value.roots.head.id)
      val thisProjectConfigs = thisProject.value.configurations.filterNot { c =>
        ConfigBlacklist.contains(c.name)
      }
      val filter             = ScopeFilter(configurations = inConfigurations(thisProjectConfigs: _*))
      val configAndModuleGraph = Def.task {
        val graph      = moduleGraph.value
        val configName = configuration.value.name

        configName -> graph
      }

      Def.task {
        val graphs = configAndModuleGraph.all(filter).value

        graphs.foldLeft(SnykProjectData(thisProjectId, Map.empty, Map.empty)) {
          case (projectData, (configName, graph)) =>
            val modules = graph.modules.flatMap {
              case (moduleId, module) =>
                if (module.isUsed) Some(formatModuleId(moduleId) -> SnykModuleInfo(moduleId.version, Set(configName)))
                else None
            }

            val depMap = graph.dependencyMap
            val dependencies = graph.modules.flatMap {
              case (moduleId, module) =>
                if (module.isUsed)
                  depMap.get(moduleId).map { deps =>
                    formatModuleId(moduleId) -> deps.collect {
                      case dep if dep.isUsed => formatModuleId(dep.id)
                    }.toSet
                  } else None
            }

            projectData.merge(modules, dependencies)
        }
      }
    }.value
  )
}
