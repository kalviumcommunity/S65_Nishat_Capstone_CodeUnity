export const codeTemplates = {
  js: `// JavaScript Template
console.log('Hello World!');

function add(a, b) {
  return a + b;
}

// Example usage
const result = add(5, 3);
console.log(result);`,

  py: `# Python Template
def main():
    print("Hello World!")
    
    def add(a, b):
        return a + b
    
    # Example usage
    result = add(5, 3)
    print(result)

if __name__ == "__main__":
    main()`,

  java: `// Java Template
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello World!");
    }
    
    public static int add(int a, int b) {
        return a + b;
    }
}`,

  cpp: `// C++ Template
#include <iostream>

int main() {
    std::cout << "Hello World!" << std::endl;
    return 0;
}`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    <h1>Hello World!</h1>
</body>
</html>`,

  ts: `// TypeScript Template
function add(a: number, b: number): number {
  return a + b;
}

console.log('Hello World!');
console.log(add(5, 3));`,

  go: `// Go Template
package main
import "fmt"

func add(a int, b int) int {
    return a + b
}

func main() {
    fmt.Println("Hello World!")
    fmt.Println(add(5, 3))
}`,

  rb: `# Ruby Template
def add(a, b)
  a + b
end

puts 'Hello World!'
puts add(5, 3)
`,

  php: `<?php
// PHP Template
function add($a, $b) {
    return $a + $b;
}
echo "Hello World!\n";
echo add(5, 3);
?>`,

  rs: `// Rust Template
fn add(a: i32, b: i32) -> i32 {
    a + b
}

fn main() {
    println!("Hello World!");
    println!("{}", add(5, 3));
}`,

  kt: `// Kotlin Template
fun add(a: Int, b: Int): Int = a + b

fun main() {
    println("Hello World!")
    println(add(5, 3))
}`,

  swift: `// Swift Template
func add(_ a: Int, _ b: Int) -> Int {
    return a + b
}

print("Hello World!")
print(add(5, 3))
`,

};

export const getTemplateForFile = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  return codeTemplates[extension] || '// Start typing...';
};