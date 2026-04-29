namespace test
{
    partial class login
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.licence_key = new System.Windows.Forms.TextBox();
            this.login_button = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // licence_key
            // 
            this.licence_key.Location = new System.Drawing.Point(295, 161);
            this.licence_key.Name = "licence_key";
            this.licence_key.Size = new System.Drawing.Size(100, 20);
            this.licence_key.TabIndex = 0;
            this.licence_key.TextChanged += new System.EventHandler(this.licence_key_TextChanged);
            // 
            // login_button
            // 
            this.login_button.Location = new System.Drawing.Point(307, 258);
            this.login_button.Name = "login_button";
            this.login_button.Size = new System.Drawing.Size(75, 23);
            this.login_button.TabIndex = 1;
            this.login_button.Text = "button1";
            this.login_button.UseVisualStyleBackColor = true;
            this.login_button.Click += new System.EventHandler(this.login_button_Click);
            // 
            // login
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.login_button);
            this.Controls.Add(this.licence_key);
            this.Name = "login";
            this.Text = "Form1";
            this.Load += new System.EventHandler(this.login_Load);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox licence_key;
        private System.Windows.Forms.Button login_button;
    }
}

