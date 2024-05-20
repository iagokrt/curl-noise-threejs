import os
import sys

class Script:
    def __init__(self, folder_name='teste'):
        self.folder_name = folder_name
        self.current_dir = os.getcwd()
        self.new_folder_path = os.path.join(self.current_dir, self.folder_name)
    
    def create_folder(self):
        os.makedirs(self.new_folder_path, exist_ok=True)
        print(f"Pasta criada: {self.new_folder_path}")
    
    def create_index_html(self):
        file_path = os.path.join(self.new_folder_path, 'index.html')
        with open(file_path, 'w') as f:
            pass
        print(f"Arquivo criado: {file_path}")
    
    def create_index_js(self):
        file_path = os.path.join(self.new_folder_path, 'index.js')
        with open(file_path, 'w') as f:
            pass
        print(f"Arquivo criado: {file_path}")

    def fill_index_html(self, template_path):
        file_path = os.path.join(self.new_folder_path, 'index.html')
        with open(template_path, 'r') as template_file:
            template_content = template_file.read()
        with open(file_path, 'w') as f:
            f.write(template_content)
        print(f"Arquivo index.html preenchido com o template: {file_path}")

    def fill_index_js(self, template_path):
        file_path = os.path.join(self.new_folder_path, 'index.js')
        with open(template_path, 'r') as template_file:
            template_content = template_file.read()
        with open(file_path, 'w') as f:
            f.write(template_content)
        print(f"Arquivo index.js preenchido com o template: {file_path}")
    
    def add_to_webpack_plugins(self):
        config_path = os.path.join(self.current_dir, 'webpack.config.plugins.js')
    
if __name__ == "__main__":
    folder_name = sys.argv[1] if len(sys.argv) > 1 else 'teste'
    project = Script(folder_name)
    project.create_folder()
    project.create_index_html()
    project.create_index_js()

    html_template_path = './default/index.html'
    js_template_path = './default/index.js'

    if os.path.exists(html_template_path):
        project.fill_index_html(html_template_path)
    else:
        print(f"Template HTML não encontrado: {html_template_path}")

    if os.path.exists(js_template_path):
        project.fill_index_js(js_template_path)
    else:
        print(f"Template JS não encontrado: {js_template_path}")

