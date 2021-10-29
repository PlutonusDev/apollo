module.exports = {
	name: "Task Manager",
	init: bot => {
		bot.tasks = {};
		bot.tasks.running = [];
		bot.tasks.taskTimers = {};

		process.on("exit", async (code) => {
			bot.logger.log("Waiting for tasks to complete before exit");
			setInterval(() => {
				if(bot.tasks.running.length === 0) {
					bot.logger.log("All tasks completed! Bye bye!");
					process.exit(0);
				} else bot.logger.warn(`There are currently ${bot.tasks.running.length} tasks in progress...`);
			}, 1000);
		});

		bot.tasks.startTask = (name, id) => {
			if(bot.tasks.hasTask(name, id)) return bot.logger.warn(`Task ${name} (${id}) already exists!`);
			bot.tasks.running.push(name+id);
			bot.tasks.taskTimers[name+id] = setTimeout(() => {
				bot.logger.warn(`Task ${name}-${id} did not automatically finish!`);
				bot.tasks.endTask(name, id);
			}, 1500000);
			bot.logger.log(`Started task ${name} (${id})`);
		}

		bot.tasks.hasTask = (name, id) => {
			return bot.tasks.getTaskIndex(name, id) > -1;
		}

		bot.tasks.getTaskIndex = (name, id) => {
			return bot.tasks.running.indexOf(name+id);
		}

		bot.tasks.renewTask = (name, id) => {
			if(!bot.tasks.hasTask(name, id)) return bot.logger.warn(`Task ${name} (${id}) cannot be renewed as it isn't running`);
			if(bot.tasks.taskTimers[name+id]) clearTimeout(bot.tasks.taskTimers[name+id]);
			bot.tasks.taskTimers[name+id] = setTimeout(() => {
				bot.logger.warn(`Task ${name}-${id} did not automatically finish!`);
				bot.tasks.endTask(name, id);
			}, 1500000);
		}

		bot.tasks.endTask = (name, id) => {
			if(!bot.tasks.hasTask(name, id)) return bot.logger.warn(`Task ${name} (${id}) cannot be stopped as it isn't running`);
			if(bot.tasks.taskTimers[name+id]) clearTimeout(bot.tasks.taskTimers[name+id]);
			bot.logger.log(`Task ${name}-${id} completed or otherwise ended`);
			bot.tasks.running.splice(bot.tasks.getTaskIndex(name, id), 1);
			bot.stats.tasksCompleted++;
		}

		bot.api.get("/tasks", (req, res) => res.json(bot.tasks.running));
	}
}
