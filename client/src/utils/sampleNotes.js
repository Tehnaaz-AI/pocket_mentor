export const sampleNotes = [
  {
    id: 'cs-concurrency',
    title: 'Operating Systems: Concurrency & Deadlocks',
    subject: 'Computer Science',
    difficulty: 'Medium',
    text: `Operating Systems: Process Synchronization, Critical Sections & Deadlocks

1. Critical Section Problem:
A critical section is a segment of code where a process accesses shared resources, such as variables, tables, or files. To prevent race conditions, three requirements must be satisfied:
- Mutual Exclusion: If process Pi is executing in its critical section, no other processes can be executing in their critical sections.
- Progress: If no process is executing in its critical section and some processes wish to enter, only those processes that are not executing in their remainder sections can participate in deciding which will enter next.
- Bounded Waiting: There must be a bound or limit on the number of times that other processes are allowed to enter their critical sections after a process has made a request to enter and before that request is granted.

2. Synchronization Mechanisms:
- Mutex Lock: A boolean variable that enforces mutual exclusion. A process must acquire the lock before entering a critical section and release it when exiting.
- Semaphores: A synchronization tool that provides more sophisticated ways for processes to synchronize activities.
  * Counting Semaphore: Can range over an unrestricted domain, useful for controlling access to a resource pool with finite instances.
  * Binary Semaphore: Can range only between 0 and 1, essentially identical to a mutex lock.
  * Operations: wait() (or P) decrements the semaphore; signal() (or V) increments the semaphore.

3. Deadlocks:
A deadlock occurs when two or more processes are permanently blocked because each process holds a resource that another process needs.
Four Coffman Conditions necessary for deadlock:
1. Mutual Exclusion: At least one resource must be held in a non-shareable mode.
2. Hold and Wait: A process must be holding at least one resource and waiting to acquire additional resources held by other processes.
3. No Preemption: Resources cannot be forcibly preempted; they can only be released voluntarily by the holding process.
4. Circular Wait: A closed chain of processes exists such that each process holds at least one resource that is needed by the next process in the chain.

4. Deadlock Handling Strategies:
- Prevention: Invalidate at least one of the four Coffman conditions (e.g., impose total resource ordering to eliminate circular wait).
- Avoidance: Ensure the system never enters an unsafe state using algorithms such as Dijkstra's Banker's Algorithm.
- Detection and Recovery: Allow deadlocks to occur, detect cycle via Resource Allocation Graphs, and recover by process termination or resource preemption.`
  },
  {
    id: 'bio-cellular',
    title: 'Cellular Respiration & ATP Synthesis',
    subject: 'Biology',
    difficulty: 'Medium',
    text: `Cellular Respiration: Catabolic Pathways and ATP Generation

Overview:
Cellular respiration is the metabolic process that releases chemical energy stored in glucose molecules to produce ATP (adenosine triphosphate). The overall balanced equation is: C6H12O6 + 6O2 -> 6CO2 + 6H2O + ~30-32 ATP.

Stage 1: Glycolysis (Cytoplasm)
- Anaerobic phase occurring directly in the cytosol.
- Glucose (6-carbon) is converted into two molecules of Pyruvate (3-carbon).
- Net yield per glucose: 2 ATP (via substrate-level phosphorylation) and 2 NADH.
- Rate-limiting enzyme: Phosphofructokinase (PFK), which is allosterically inhibited by ATP and stimulated by AMP.

Stage 2: Pyruvate Oxidation & Citric Acid Cycle (Mitochondrial Matrix)
- Pyruvate enters the mitochondrion via active transport and is converted into Acetyl-CoA by Pyruvate Dehydrogenase, releasing CO2 and 1 NADH per pyruvate.
- Citric Acid Cycle (Krebs Cycle): Acetyl-CoA (2C) combines with Oxaloacetate (4C) to form Citrate (6C).
- Each turn produces: 3 NADH, 1 FADH2, 1 ATP/GTP, and 2 CO2.
- Since one glucose produces two pyruvates, the cycle turns twice per glucose.

Stage 3: Oxidative Phosphorylation (Inner Mitochondrial Membrane)
- Electron Transport Chain (ETC): Complexes I, II, III, and IV transfer electrons from NADH and FADH2 to Oxygen (the terminal electron acceptor), forming water.
- Proton Gradient: Electron transfer pumps H+ ions from matrix to the intermembrane space, creating an electrochemical proton-motive force.
- Chemiosmosis: Protons flow back into matrix through ATP Synthase rotor complexes, driving oxidative phosphorylation of ADP into ATP.
- Theoretical ATP yield: Approximately 2.5 ATP per NADH and 1.5 ATP per FADH2.`
  },
  {
    id: 'ml-foundations',
    title: 'Machine Learning: Loss, Overfitting & Regularization',
    subject: 'Data Science',
    difficulty: 'Hard',
    text: `Machine Learning Foundations: Generalization, Overfitting and Optimization

1. Core Objective & Loss Functions:
In supervised learning, models learn a mapping function f(x; θ) minimizing empirical risk over training samples.
- Mean Squared Error (MSE): Used in regression; penalizes large errors quadratically.
- Cross-Entropy Loss: Used in classification; measures distance between predicted probability distribution and ground truth one-hot vector.

2. The Bias-Variance Tradeoff:
- High Bias (Underfitting): Model is overly simplistic and cannot capture underlying data trends. Results in high training error and high validation error.
- High Variance (Overfitting): Model memorizes training noise and idiosyncrasies. Results in very low training error but poor generalization on unseen validation data.

3. Regularization Techniques:
Techniques designed to discourage model complexity and prevent overfitting:
- L2 Regularization (Ridge / Weight Decay): Adds sum of squared weights ||w||_2^2 to the loss function. Encourages weights to be small and spread out, preventing extreme sensitivity.
- L1 Regularization (Lasso): Adds sum of absolute weights ||w||_1 to the loss function. Drives non-essential weights strictly to zero, yielding sparse feature selection.
- Dropout: Randomly deactivates neurons during training with probability p. Forces redundant feature representations.
- Early Stopping: Monitors validation loss and halts optimization when validation loss begins to rise, despite continued drop in training loss.

4. Gradient Descent Optimization:
- Learning Rate (η): Controls step size along negative gradient direction.
- Momentum: Accumulates past gradients to dampen oscillations and accelerate through plateaus.
- Adam Optimizer: Combines momentum (first moment estimation) and RMSProp (adaptive learning rates based on second uncentered moments).`
  }
];
