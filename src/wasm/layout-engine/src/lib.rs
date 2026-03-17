use wasm_bindgen::prelude::*;
use js_sys::Array;
use web_sys::console;
use std::collections::HashMap;
use rayon::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global allocator
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Node {
    pub id: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub mass: f64,
    pub fixed: bool,
    pub node_type: String,
}

#[wasm_bindgen]
impl Node {
    #[wasm_bindgen(constructor)]
    pub fn new(id: String, x: f64, y: f64, width: f64, height: f64, node_type: String) -> Node {
        Node {
            id,
            x,
            y,
            width,
            height,
            mass: 1.0,
            fixed: false,
            node_type,
        }
    }
    
    #[wasm_bindgen(getter)]
    pub fn id(&self) -> String {
        self.id.clone()
    }
    
    #[wasm_bindgen(getter)]
    pub fn x(&self) -> f64 {
        self.x
    }
    
    #[wasm_bindgen(getter)]
    pub fn y(&self) -> f64 {
        self.y
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_x(&mut self, x: f64) {
        self.x = x;
    }
    
    #[wasm_bindgen(setter)]
    pub fn set_y(&mut self, y: f64) {
        self.y = y;
    }
}

#[wasm_bindgen]
#[derive(Clone, Debug)]
pub struct Edge {
    pub source: String,
    pub target: String,
    pub weight: f64,
    pub length: f64,
}

#[wasm_bindgen]
impl Edge {
    #[wasm_bindgen(constructor)]
    pub fn new(source: String, target: String, weight: f64, length: f64) -> Edge {
        Edge {
            source,
            target,
            weight,
            length,
        }
    }
}

#[wasm_bindgen]
pub struct LayoutEngine {
    nodes: Vec<Node>,
    edges: Vec<Edge>,
    width: f64,
    height: f64,
    iterations: usize,
    temperature: f64,
    cooling_factor: f64,
    repulsion_strength: f64,
    attraction_strength: f64,
    gravity_strength: f64,
    use_barnes_hut: bool,
    theta: f64, // Barnes-Hut approximation parameter
}

#[wasm_bindgen]
impl LayoutEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f64, height: f64) -> LayoutEngine {
        console_log!("Initializing WASM Layout Engine {}x{}", width, height);
        
        LayoutEngine {
            nodes: Vec::new(),
            edges: Vec::new(),
            width,
            height,
            iterations: 500,
            temperature: width / 10.0,
            cooling_factor: 0.95,
            repulsion_strength: 1000.0,
            attraction_strength: 0.1,
            gravity_strength: 0.01,
            use_barnes_hut: true,
            theta: 0.5,
        }
    }
    
    #[wasm_bindgen]
    pub fn add_node(&mut self, node: Node) {
        self.nodes.push(node);
    }
    
    #[wasm_bindgen]
    pub fn add_edge(&mut self, edge: Edge) {
        self.edges.push(edge);
    }
    
    #[wasm_bindgen]
    pub fn set_parameters(
        &mut self,
        iterations: usize,
        repulsion: f64,
        attraction: f64,
        gravity: f64,
        use_barnes_hut: bool,
    ) {
        self.iterations = iterations;
        self.repulsion_strength = repulsion;
        self.attraction_strength = attraction;
        self.gravity_strength = gravity;
        self.use_barnes_hut = use_barnes_hut;
    }
    
    #[wasm_bindgen]
    pub fn calculate_force_directed_layout(&mut self) -> Array {
        console_log!("Starting force-directed layout with {} nodes, {} edges", 
                    self.nodes.len(), self.edges.len());
        
        let start_time = js_sys::Date::now();
        
        // Initialize positions if not set
        self.initialize_positions();
        
        // Create node index for fast lookup
        let mut node_index: HashMap<String, usize> = HashMap::new();
        for (i, node) in self.nodes.iter().enumerate() {
            node_index.insert(node.id.clone(), i);
        }
        
        let mut current_temp = self.temperature;
        
        for iteration in 0..self.iterations {
            let mut forces: Vec<(f64, f64)> = vec![(0.0, 0.0); self.nodes.len()];
            
            // Calculate repulsive forces
            if self.use_barnes_hut && self.nodes.len() > 100 {
                self.calculate_repulsive_forces_barnes_hut(&mut forces);
            } else {
                self.calculate_repulsive_forces_naive(&mut forces);
            }
            
            // Calculate attractive forces
            self.calculate_attractive_forces(&mut forces, &node_index);
            
            // Apply gravity
            self.apply_gravity(&mut forces);
            
            // Update positions
            self.update_positions(&forces, current_temp);
            
            // Cool down
            current_temp *= self.cooling_factor;
            
            // Early termination check
            if iteration % 50 == 0 {
                let total_energy = self.calculate_total_energy(&forces);
                if total_energy < 0.01 {
                    console_log!("Converged after {} iterations", iteration);
                    break;
                }
            }
        }
        
        let end_time = js_sys::Date::now();
        console_log!("Layout completed in {:.2}ms", end_time - start_time);
        
        // Return positions as JS Array
        self.export_positions()
    }
    
    #[wasm_bindgen]
    pub fn calculate_hierarchical_layout(&mut self) -> Array {
        console_log!("Starting hierarchical layout");
        
        let start_time = js_sys::Date::now();
        
        // Find root nodes (nodes with no incoming edges)
        let mut incoming_count: HashMap<String, usize> = HashMap::new();
        for edge in &self.edges {
            *incoming_count.entry(edge.target.clone()).or_insert(0) += 1;
        }
        
        let root_nodes: Vec<String> = self.nodes
            .iter()
            .filter(|node| !incoming_count.contains_key(&node.id))
            .map(|node| node.id.clone())
            .collect();
        
        console_log!("Found {} root nodes", root_nodes.len());
        
        // Assign levels using BFS
        let mut levels: HashMap<String, usize> = HashMap::new();
        let mut queue: Vec<(String, usize)> = root_nodes
            .iter()
            .map(|id| (id.clone(), 0))
            .collect();
        
        while let Some((node_id, level)) = queue.pop() {
            if levels.contains_key(&node_id) {
                continue;
            }
            
            levels.insert(node_id.clone(), level);
            
            // Add children to queue
            for edge in &self.edges {
                if edge.source == node_id && !levels.contains_key(&edge.target) {
                    queue.push((edge.target.clone(), level + 1));
                }
            }
        }
        
        // Calculate positions based on levels
        let max_level = levels.values().max().unwrap_or(&0);
        let level_height = self.height / (*max_level as f64 + 1.0);
        
        // Group nodes by level
        let mut level_groups: HashMap<usize, Vec<String>> = HashMap::new();
        for (node_id, level) in &levels {
            level_groups.entry(*level).or_insert_with(Vec::new).push(node_id.clone());
        }
        
        // Position nodes
        for (level, node_ids) in level_groups {
            let y = level as f64 * level_height + level_height / 2.0;
            let node_width = self.width / node_ids.len() as f64;
            
            for (i, node_id) in node_ids.iter().enumerate() {
                if let Some(node) = self.nodes.iter_mut().find(|n| n.id == *node_id) {
                    node.x = i as f64 * node_width + node_width / 2.0;
                    node.y = y;
                }
            }
        }
        
        // Apply force-directed refinement
        self.refine_hierarchical_layout();
        
        let end_time = js_sys::Date::now();
        console_log!("Hierarchical layout completed in {:.2}ms", end_time - start_time);
        
        self.export_positions()
    }
    
    #[wasm_bindgen]
    pub fn calculate_circular_layout(&mut self) -> Array {
        console_log!("Starting circular layout");
        
        let node_count = self.nodes.len();
        if node_count == 0 {
            return Array::new();
        }
        
        let center_x = self.width / 2.0;
        let center_y = self.height / 2.0;
        let radius = (self.width.min(self.height) / 2.0) * 0.8;
        
        // Sort nodes by degree (number of connections) for better visual distribution
        let mut node_degrees: Vec<(usize, usize)> = Vec::new();
        for (i, node) in self.nodes.iter().enumerate() {
            let degree = self.edges.iter()
                .filter(|edge| edge.source == node.id || edge.target == node.id)
                .count();
            node_degrees.push((i, degree));
        }
        
        node_degrees.sort_by(|a, b| b.1.cmp(&a.1)); // Sort by degree descending
        
        // Position nodes in circle
        for (pos, (node_idx, _)) in node_degrees.iter().enumerate() {
            let angle = 2.0 * std::f64::consts::PI * pos as f64 / node_count as f64;
            let x = center_x + radius * angle.cos();
            let y = center_y + radius * angle.sin();
            
            self.nodes[*node_idx].x = x;
            self.nodes[*node_idx].y = y;
        }
        
        self.export_positions()
    }
    
    #[wasm_bindgen]
    pub fn calculate_grid_layout(&mut self, columns: usize) -> Array {
        console_log!("Starting grid layout with {} columns", columns);
        
        let node_count = self.nodes.len();
        if node_count == 0 {
            return Array::new();
        }
        
        let rows = (node_count + columns - 1) / columns;
        let cell_width = self.width / columns as f64;
        let cell_height = self.height / rows as f64;
        
        for (i, node) in self.nodes.iter_mut().enumerate() {
            let row = i / columns;
            let col = i % columns;
            
            node.x = col as f64 * cell_width + cell_width / 2.0;
            node.y = row as f64 * cell_height + cell_height / 2.0;
        }
        
        self.export_positions()
    }
    
    // Private helper methods
    fn initialize_positions(&mut self) {
        use js_sys::Math;
        
        for node in &mut self.nodes {
            if node.x == 0.0 && node.y == 0.0 {
                node.x = Math::random() * self.width;
                node.y = Math::random() * self.height;
            }
        }
    }
    
    fn calculate_repulsive_forces_naive(&self, forces: &mut Vec<(f64, f64)>) {
        for i in 0..self.nodes.len() {
            for j in (i + 1)..self.nodes.len() {
                let node1 = &self.nodes[i];
                let node2 = &self.nodes[j];
                
                let dx = node1.x - node2.x;
                let dy = node1.y - node2.y;
                let distance = (dx * dx + dy * dy).sqrt().max(1.0);
                
                let force = self.repulsion_strength / (distance * distance);
                let fx = (dx / distance) * force;
                let fy = (dy / distance) * force;
                
                forces[i].0 += fx;
                forces[i].1 += fy;
                forces[j].0 -= fx;
                forces[j].1 -= fy;
            }
        }
    }
    
    fn calculate_repulsive_forces_barnes_hut(&self, forces: &mut Vec<(f64, f64)>) {
        // Simplified Barnes-Hut implementation
        // In a full implementation, you'd build a quadtree
        let mut quadtree = QuadTree::new(0.0, 0.0, self.width, self.height);
        
        // Insert all nodes into quadtree
        for (i, node) in self.nodes.iter().enumerate() {
            quadtree.insert(i, node.x, node.y, node.mass);
        }
        
        // Calculate forces using quadtree approximation
        for (i, node) in self.nodes.iter().enumerate() {
            let (fx, fy) = quadtree.calculate_force(
                node.x, 
                node.y, 
                self.repulsion_strength, 
                self.theta
            );
            forces[i].0 += fx;
            forces[i].1 += fy;
        }
    }
    
    fn calculate_attractive_forces(&self, forces: &mut Vec<(f64, f64)>, node_index: &HashMap<String, usize>) {
        for edge in &self.edges {
            if let (Some(&source_idx), Some(&target_idx)) = 
                (node_index.get(&edge.source), node_index.get(&edge.target)) {
                
                let source = &self.nodes[source_idx];
                let target = &self.nodes[target_idx];
                
                let dx = target.x - source.x;
                let dy = target.y - source.y;
                let distance = (dx * dx + dy * dy).sqrt().max(1.0);
                
                let force = self.attraction_strength * (distance - edge.length) * edge.weight;
                let fx = (dx / distance) * force;
                let fy = (dy / distance) * force;
                
                forces[source_idx].0 += fx;
                forces[source_idx].1 += fy;
                forces[target_idx].0 -= fx;
                forces[target_idx].1 -= fy;
            }
        }
    }
    
    fn apply_gravity(&self, forces: &mut Vec<(f64, f64)>) {
        let center_x = self.width / 2.0;
        let center_y = self.height / 2.0;
        
        for (i, node) in self.nodes.iter().enumerate() {
            let dx = center_x - node.x;
            let dy = center_y - node.y;
            let distance = (dx * dx + dy * dy).sqrt().max(1.0);
            
            let force = self.gravity_strength * node.mass;
            forces[i].0 += (dx / distance) * force;
            forces[i].1 += (dy / distance) * force;
        }
    }
    
    fn update_positions(&mut self, forces: &Vec<(f64, f64)>, temperature: f64) {
        for (i, node) in self.nodes.iter_mut().enumerate() {
            if node.fixed {
                continue;
            }
            
            let (fx, fy) = forces[i];
            let force_magnitude = (fx * fx + fy * fy).sqrt();
            
            if force_magnitude > 0.0 {
                let displacement = force_magnitude.min(temperature);
                let dx = (fx / force_magnitude) * displacement;
                let dy = (fy / force_magnitude) * displacement;
                
                node.x += dx;
                node.y += dy;
                
                // Keep within bounds
                node.x = node.x.max(node.width / 2.0).min(self.width - node.width / 2.0);
                node.y = node.y.max(node.height / 2.0).min(self.height - node.height / 2.0);
            }
        }
    }
    
    fn calculate_total_energy(&self, forces: &Vec<(f64, f64)>) -> f64 {
        forces.iter()
            .map(|(fx, fy)| fx * fx + fy * fy)
            .sum::<f64>()
            .sqrt()
    }
    
    fn refine_hierarchical_layout(&mut self) {
        // Apply limited force-directed refinement to hierarchical layout
        let original_iterations = self.iterations;
        self.iterations = 50; // Fewer iterations for refinement
        
        // Reduce forces to maintain hierarchy
        let original_repulsion = self.repulsion_strength;
        let original_attraction = self.attraction_strength;
        
        self.repulsion_strength *= 0.1;
        self.attraction_strength *= 0.5;
        
        // Run limited force-directed layout
        self.calculate_force_directed_layout();
        
        // Restore original parameters
        self.iterations = original_iterations;
        self.repulsion_strength = original_repulsion;
        self.attraction_strength = original_attraction;
    }
    
    fn export_positions(&self) -> Array {
        let result = Array::new();
        
        for node in &self.nodes {
            let position = Array::new();
            position.push(&JsValue::from_str(&node.id));
            position.push(&JsValue::from_f64(node.x));
            position.push(&JsValue::from_f64(node.y));
            result.push(&position);
        }
        
        result
    }
}

// Simplified QuadTree for Barnes-Hut approximation
struct QuadTree {
    x: f64,
    y: f64,
    width: f64,
    height: f64,
    nodes: Vec<(usize, f64, f64, f64)>, // (index, x, y, mass)
    children: Option<Box<[QuadTree; 4]>>,
    center_of_mass: (f64, f64),
    total_mass: f64,
}

impl QuadTree {
    fn new(x: f64, y: f64, width: f64, height: f64) -> Self {
        QuadTree {
            x,
            y,
            width,
            height,
            nodes: Vec::new(),
            children: None,
            center_of_mass: (0.0, 0.0),
            total_mass: 0.0,
        }
    }
    
    fn insert(&mut self, index: usize, x: f64, y: f64, mass: f64) {
        // Update center of mass
        let new_total_mass = self.total_mass + mass;
        self.center_of_mass.0 = (self.center_of_mass.0 * self.total_mass + x * mass) / new_total_mass;
        self.center_of_mass.1 = (self.center_of_mass.1 * self.total_mass + y * mass) / new_total_mass;
        self.total_mass = new_total_mass;
        
        if self.nodes.is_empty() && self.children.is_none() {
            // Leaf node, add directly
            self.nodes.push((index, x, y, mass));
        } else if self.children.is_none() {
            // Need to subdivide
            self.subdivide();
            
            // Move existing node to appropriate child
            let existing = self.nodes.pop().unwrap();
            self.insert_into_child(existing.0, existing.1, existing.2, existing.3);
            
            // Insert new node
            self.insert_into_child(index, x, y, mass);
        } else {
            // Already subdivided, insert into appropriate child
            self.insert_into_child(index, x, y, mass);
        }
    }
    
    fn subdivide(&mut self) {
        let half_width = self.width / 2.0;
        let half_height = self.height / 2.0;
        
        self.children = Some(Box::new([
            QuadTree::new(self.x, self.y, half_width, half_height), // NW
            QuadTree::new(self.x + half_width, self.y, half_width, half_height), // NE
            QuadTree::new(self.x, self.y + half_height, half_width, half_height), // SW
            QuadTree::new(self.x + half_width, self.y + half_height, half_width, half_height), // SE
        ]));
    }
    
    fn insert_into_child(&mut self, index: usize, x: f64, y: f64, mass: f64) {
        if let Some(ref mut children) = self.children {
            let child_index = if x < self.x + self.width / 2.0 {
                if y < self.y + self.height / 2.0 { 0 } else { 2 } // NW or SW
            } else {
                if y < self.y + self.height / 2.0 { 1 } else { 3 } // NE or SE
            };
            
            children[child_index].insert(index, x, y, mass);
        }
    }
    
    fn calculate_force(&self, x: f64, y: f64, repulsion_strength: f64, theta: f64) -> (f64, f64) {
        if self.total_mass == 0.0 {
            return (0.0, 0.0);
        }
        
        let dx = self.center_of_mass.0 - x;
        let dy = self.center_of_mass.1 - y;
        let distance = (dx * dx + dy * dy).sqrt().max(1.0);
        
        // Check if we can use approximation
        if self.width / distance < theta || self.children.is_none() {
            // Use center of mass approximation
            let force = repulsion_strength * self.total_mass / (distance * distance);
            let fx = (dx / distance) * force;
            let fy = (dy / distance) * force;
            (fx, fy)
        } else {
            // Recurse into children
            let mut total_fx = 0.0;
            let mut total_fy = 0.0;
            
            if let Some(ref children) = self.children {
                for child in children.iter() {
                    let (fx, fy) = child.calculate_force(x, y, repulsion_strength, theta);
                    total_fx += fx;
                    total_fy += fy;
                }
            }
            
            (total_fx, total_fy)
        }
    }
}

#[wasm_bindgen(start)]
pub fn main() {
    console_log!("WASM Layout Engine initialized");
}
